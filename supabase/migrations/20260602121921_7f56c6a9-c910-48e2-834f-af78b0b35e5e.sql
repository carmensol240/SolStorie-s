CREATE TABLE public.pdf_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid,
  source text,
  amount_paid numeric NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

GRANT SELECT ON public.pdf_entitlements TO authenticated;
GRANT ALL ON public.pdf_entitlements TO service_role;

ALTER TABLE public.pdf_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pdf entitlements"
ON public.pdf_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pdf entitlements"
ON public.pdf_entitlements
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages pdf entitlements"
ON public.pdf_entitlements
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE INDEX idx_pdf_entitlements_user ON public.pdf_entitlements(user_id);