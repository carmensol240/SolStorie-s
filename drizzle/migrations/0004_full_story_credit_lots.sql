-- Credits remember their package. Only "full story" credits are tracked as lots;
-- every other story credit on profiles.story_credits counts as a digital credit.
CREATE TABLE public.story_credit_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'full' CHECK (kind IN ('full')),
  remaining integer NOT NULL DEFAULT 0 CHECK (remaining >= 0),
  source text,
  order_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, kind)
);
CREATE INDEX story_credit_lots_user ON public.story_credit_lots (user_id);
GRANT SELECT ON public.story_credit_lots TO authenticated;
GRANT ALL ON public.story_credit_lots TO service_role;
ALTER TABLE public.story_credit_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin can view credit lots"
  ON public.story_credit_lots FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.story_coloring_allowances IS 'DEPRECATED: coloring pages are open for every purchased story (story_unlocks).';

-- Spend one story credit of the requested kind. Returns the kind spent, or NULL.
CREATE OR REPLACE FUNCTION public.consume_story_credit(p_user_id uuid, p_kind text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_total integer; v_full integer; v_lot uuid;
BEGIN
  SELECT COALESCE(story_credits, 0) INTO v_total FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_total IS NULL OR v_total <= 0 THEN RETURN NULL; END IF;
  SELECT COALESCE(sum(remaining), 0) INTO v_full FROM public.story_credit_lots WHERE user_id = p_user_id;
  IF p_kind = 'full' THEN
    SELECT id INTO v_lot FROM public.story_credit_lots
      WHERE user_id = p_user_id AND remaining > 0 ORDER BY created_at LIMIT 1 FOR UPDATE;
    IF v_lot IS NULL THEN RETURN NULL; END IF;
    UPDATE public.story_credit_lots SET remaining = remaining - 1 WHERE id = v_lot;
  ELSIF p_kind = 'digital' THEN
    IF v_total - v_full <= 0 THEN RETURN NULL; END IF;
  ELSE
    RETURN NULL;
  END IF;
  UPDATE public.profiles SET story_credits = v_total - 1 WHERE id = p_user_id;
  RETURN p_kind;
END; $$;

-- Give back one credit of a kind (failed creation).
CREATE OR REPLACE FUNCTION public.refund_story_credit(p_user_id uuid, p_kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles SET story_credits = COALESCE(story_credits, 0) + 1 WHERE id = p_user_id;
  IF p_kind = 'full' THEN
    INSERT INTO public.story_credit_lots (user_id, kind, remaining, source, order_id)
    VALUES (p_user_id, 'full', 1, 'refund', 'refund_' || gen_random_uuid()::text);
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.consume_story_credit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_story_credit(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_story_credit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_story_credit(uuid, text) TO service_role;