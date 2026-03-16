
CREATE TABLE public.illustration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  page_number integer NOT NULL,
  model_used text NOT NULL,
  fallback_reason text,
  had_face_reference boolean DEFAULT false,
  duration_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: admin read, service_role insert
ALTER TABLE public.illustration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view illustration logs"
  ON public.illustration_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert illustration logs"
  ON public.illustration_logs FOR INSERT
  TO public
  WITH CHECK (current_setting('role'::text) = 'service_role'::text);

-- Index for fast lookups by story
CREATE INDEX idx_illustration_logs_story ON public.illustration_logs(story_id);
CREATE INDEX idx_illustration_logs_created ON public.illustration_logs(created_at DESC);
