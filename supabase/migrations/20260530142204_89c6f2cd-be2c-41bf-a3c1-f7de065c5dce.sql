CREATE TABLE public.pending_gifts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  package_id text NOT NULL,
  child_name text NOT NULL,
  sender_name text,
  status text NOT NULL DEFAULT 'pending',
  coupon_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE INDEX idx_pending_gifts_user_status ON public.pending_gifts(user_id, status, created_at DESC);

GRANT SELECT, INSERT ON public.pending_gifts TO authenticated;
GRANT ALL ON public.pending_gifts TO service_role;

ALTER TABLE public.pending_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending gifts"
ON public.pending_gifts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending gifts"
ON public.pending_gifts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages pending gifts"
ON public.pending_gifts FOR ALL
TO public
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');