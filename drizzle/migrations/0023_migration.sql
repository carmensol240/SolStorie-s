CREATE TABLE public.admin_handled_items (
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  handled_by uuid,
  handled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_type, item_id)
);
ALTER TABLE public.admin_handled_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.admin_handled_items TO authenticated;
CREATE POLICY "admins read handled" ON public.admin_handled_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins add handled" ON public.admin_handled_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins remove handled" ON public.admin_handled_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_admin_user_flags()
RETURNS TABLE(user_id uuid, is_disposable boolean, is_banned boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, public.is_disposable_email(u.email), (u.banned_until IS NOT NULL AND u.banned_until > now())
  FROM auth.users u
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
$$;
REVOKE ALL ON FUNCTION public.get_admin_user_flags() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_flags() TO authenticated;