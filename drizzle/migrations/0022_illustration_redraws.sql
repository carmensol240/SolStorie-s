CREATE TABLE public.illustration_redraws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  page_number integer NOT NULL,
  user_id uuid NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.illustration_redraws TO authenticated;
GRANT ALL ON public.illustration_redraws TO service_role;
ALTER TABLE public.illustration_redraws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins read redraw counts" ON public.illustration_redraws
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX illustration_redraws_story_idx ON public.illustration_redraws (story_id, page_number);