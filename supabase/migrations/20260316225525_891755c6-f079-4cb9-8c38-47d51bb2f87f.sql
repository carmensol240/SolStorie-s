
CREATE TABLE public.cover_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  selected_illustration_prompt text,
  had_face_reference boolean DEFAULT false,
  cast_character text,
  topic_setting text,
  story_context text,
  cover_path text DEFAULT 'personalized',
  duration_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cover_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cover logs" ON public.cover_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert cover logs" ON public.cover_logs
  FOR INSERT
  WITH CHECK (current_setting('role'::text) = 'service_role'::text);
