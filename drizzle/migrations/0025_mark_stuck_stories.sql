CREATE OR REPLACE FUNCTION public.mark_stuck_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  -- A story still "generating" 20+ minutes after creation, with pages, whose drawing has had
  -- no activity for 15 minutes, was cut off mid-drawing: move it to needs_attention + alert once.
  FOR r IN
    SELECT s.id, s.user_id FROM public.stories s
    WHERE s.generation_status = 'generating'
      AND s.created_at < now() - interval '20 minutes'
      AND s.user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.story_pages p WHERE p.story_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM public.illustration_logs l WHERE l.story_id = s.id AND l.created_at > now() - interval '15 minutes')
    LIMIT 50
  LOOP
    UPDATE public.stories SET generation_status = 'needs_attention' WHERE id = r.id AND generation_status = 'generating';
    INSERT INTO public.admin_alerts (user_id, alert_type, message)
    VALUES (r.user_id, 'illustration_stuck', 'סיפור ' || r.id || ': הציור נעצר באמצע – הסיפור הועבר ל"דורש טיפול"');
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_stuck_stories() FROM PUBLIC, anon, authenticated;