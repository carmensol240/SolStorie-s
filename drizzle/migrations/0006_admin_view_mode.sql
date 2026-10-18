CREATE TABLE public.admin_view_mode (
  user_id uuid PRIMARY KEY,
  mode text NOT NULL DEFAULT 'admin' CHECK (mode IN ('demo','admin')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.admin_view_mode TO authenticated;
GRANT ALL ON public.admin_view_mode TO service_role;
ALTER TABLE public.admin_view_mode ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own mode" ON public.admin_view_mode FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert own mode" ON public.admin_view_mode FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update own mode" ON public.admin_view_mode FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_effective_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
     AND COALESCE((SELECT mode FROM public.admin_view_mode WHERE user_id = _user_id), 'admin') <> 'demo'
$$;