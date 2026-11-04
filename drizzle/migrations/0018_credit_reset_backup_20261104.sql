CREATE TABLE public.credit_reset_backup_20261104 (
  user_id uuid PRIMARY KEY,
  email text,
  story_credits integer,
  coloring_credits integer,
  full_lots_remaining integer,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.credit_reset_backup_20261104 TO service_role;
GRANT SELECT ON public.credit_reset_backup_20261104 TO authenticated;
ALTER TABLE public.credit_reset_backup_20261104 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read credit reset backup" ON public.credit_reset_backup_20261104
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.credit_reset_backup_20261104 (user_id, email, story_credits, coloring_credits, full_lots_remaining)
SELECT p.id, p.email, COALESCE(p.story_credits,0), COALESCE(p.coloring_credits,0),
  (SELECT COALESCE(sum(remaining),0) FROM public.story_credit_lots l WHERE l.user_id = p.id)
FROM public.profiles p
WHERE NOT public.has_role(p.id, 'admin')
  AND (COALESCE(p.story_credits,0) > 0 OR COALESCE(p.coloring_credits,0) > 0
       OR EXISTS (SELECT 1 FROM public.story_credit_lots l WHERE l.user_id = p.id AND l.remaining > 0));