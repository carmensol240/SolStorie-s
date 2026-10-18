CREATE TABLE public.story_coloring_allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  remaining integer NOT NULL DEFAULT 0 CHECK (remaining >= 0),
  source text,
  order_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, story_id)
);
CREATE INDEX story_coloring_allowances_user_story ON public.story_coloring_allowances (user_id, story_id);
GRANT SELECT ON public.story_coloring_allowances TO authenticated;
GRANT ALL ON public.story_coloring_allowances TO service_role;
ALTER TABLE public.story_coloring_allowances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin can view story coloring allowances"
  ON public.story_coloring_allowances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Atomically spend one coloring page: the story's own allowance first, then the general balance.
CREATE OR REPLACE FUNCTION public.consume_coloring_credit(p_user_id uuid, p_story_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_story_id IS NOT NULL THEN
    SELECT id INTO v_id FROM public.story_coloring_allowances
    WHERE user_id = p_user_id AND story_id = p_story_id AND remaining > 0
    ORDER BY created_at LIMIT 1 FOR UPDATE;
    IF v_id IS NOT NULL THEN
      UPDATE public.story_coloring_allowances SET remaining = remaining - 1 WHERE id = v_id;
      RETURN 'story';
    END IF;
  END IF;
  UPDATE public.profiles SET coloring_credits = coloring_credits - 1
  WHERE id = p_user_id AND COALESCE(coloring_credits, 0) > 0;
  IF FOUND THEN RETURN 'general'; END IF;
  RETURN 'none';
END;
$$;
REVOKE ALL ON FUNCTION public.consume_coloring_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_coloring_credit(uuid, uuid) TO service_role;