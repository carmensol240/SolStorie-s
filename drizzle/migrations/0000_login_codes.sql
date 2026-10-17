CREATE TABLE public.login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  link_token_hash text NOT NULL,
  ip_hash text,
  return_to text,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamptz,
  superseded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.login_codes TO service_role;
REVOKE ALL ON public.login_codes FROM anon, authenticated;
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX login_codes_email_idx ON public.login_codes (email, created_at DESC);
CREATE INDEX login_codes_ip_idx ON public.login_codes (ip_hash, created_at DESC);
CREATE INDEX login_codes_link_idx ON public.login_codes (link_token_hash);
CREATE INDEX login_codes_created_idx ON public.login_codes (created_at);
SELECT cron.schedule('cleanup-login-codes', '17 3 * * *', $$DELETE FROM public.login_codes WHERE created_at < now() - interval '2 days'$$);