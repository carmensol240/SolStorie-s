ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS edit_round_closed_at timestamptz;

CREATE OR REPLACE FUNCTION public.close_edit_round(p_story_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ts timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.stories
     SET edit_round_closed_at = COALESCE(edit_round_closed_at, now())
   WHERE id = p_story_id AND user_id = auth.uid()
  RETURNING edit_round_closed_at INTO v_ts;
  IF v_ts IS NULL THEN RAISE EXCEPTION 'not the story owner'; END IF;
  RETURN v_ts;
END;
$$;

REVOKE ALL ON FUNCTION public.close_edit_round(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_edit_round(uuid) TO authenticated;