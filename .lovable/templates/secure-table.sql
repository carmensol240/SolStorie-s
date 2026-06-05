-- =============================================================================
-- Secure-by-default table templates for SoulStory (public schema)
-- =============================================================================
-- Every new public.<table> MUST follow: CREATE → GRANT → ENABLE RLS → POLICY.
-- The auto_secure_new_table_trg event trigger is a safety net (turns on RLS,
-- revokes anon/authenticated, grants service_role) but DOES NOT write policies.
-- After running any schema migration, run supabase--linter and resolve WARN/ERROR.
-- =============================================================================


-- ---------- 1. OWNER-SCOPED TABLE (most common) ------------------------------
-- Each row belongs to one user (user_id). Owner can CRUD; admins read all;
-- service_role can do anything (for edge functions).

CREATE TABLE public.example_owner_scoped (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- ... domain columns ...
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_owner_scoped TO authenticated;
GRANT ALL ON public.example_owner_scoped TO service_role;
-- NOTE: no GRANT to anon — every policy scopes to auth.uid().

ALTER TABLE public.example_owner_scoped ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read own rows"
  ON public.example_owner_scoped FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own rows"
  ON public.example_owner_scoped FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own rows"
  ON public.example_owner_scoped FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete own rows"
  ON public.example_owner_scoped FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all rows"
  ON public.example_owner_scoped FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ---------- 2. ADMIN-ONLY TABLE (logs, audit, internal data) -----------------
-- Only service_role writes (via edge functions); only admins read.

CREATE TABLE public.example_admin_only (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... domain columns ...
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.example_admin_only TO authenticated; -- admin SELECT policy filters
GRANT ALL ON public.example_admin_only TO service_role;
-- No anon access.

ALTER TABLE public.example_admin_only ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read logs"
  ON public.example_admin_only FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages logs"
  ON public.example_admin_only FOR ALL
  TO public
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Belt + suspenders: explicit restrictive deny for non-admins to block enumeration.
CREATE POLICY "Restrict reads to admins"
  ON public.example_admin_only AS RESTRICTIVE
  FOR SELECT TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));


-- ---------- 3. PUBLIC-READ TABLE (catalog, premium_stories, topics) ----------
-- Anyone (logged out or in) can read active rows; only admins write.

CREATE TABLE public.example_public_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  -- ... domain columns ...
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.example_public_catalog TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.example_public_catalog TO authenticated;
GRANT ALL ON public.example_public_catalog TO service_role;

ALTER TABLE public.example_public_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active items"
  ON public.example_public_catalog FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage catalog"
  ON public.example_public_catalog FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));