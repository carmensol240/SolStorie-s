CREATE TABLE public.maintenance_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can signup" ON public.maintenance_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view signups" ON public.maintenance_signups
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_maintenance_signups_email ON public.maintenance_signups(email);