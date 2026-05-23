
-- 1. Remove broad child-photos SELECT policies; keep scoped one
DROP POLICY IF EXISTS "Users can view child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own child photos" ON storage.objects;
-- Drop duplicate child-photos policies (keep one of each)
DROP POLICY IF EXISTS "Users can delete their child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload child photos" ON storage.objects;

-- 2. Restrict listing on public buckets (direct public URL access bypasses RLS)
DROP POLICY IF EXISTS "Public can view story illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for story illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Topic images are publicly accessible" ON storage.objects;

-- 3. Block privilege escalation via profiles UPDATE
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role to change anything
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block changes to privilege-related columns by regular users
  IF NEW.is_subscriber IS DISTINCT FROM OLD.is_subscriber
     OR NEW.story_credits IS DISTINCT FROM OLD.story_credits
     OR NEW.user_role IS DISTINCT FROM OLD.user_role
     OR NEW.editing_credits IS DISTINCT FROM OLD.editing_credits
     OR NEW.coloring_credits IS DISTINCT FROM OLD.coloring_credits
     OR NEW.free_edits_remaining IS DISTINCT FROM OLD.free_edits_remaining
     OR NEW.free_edits_total IS DISTINCT FROM OLD.free_edits_total
     OR NEW.daily_edit_credits IS DISTINCT FROM OLD.daily_edit_credits
     OR NEW.last_edit_credits_reset IS DISTINCT FROM OLD.last_edit_credits_reset
     OR NEW.commercial_abuse_flagged IS DISTINCT FROM OLD.commercial_abuse_flagged
     OR NEW.commercial_abuse_flagged_at IS DISTINCT FROM OLD.commercial_abuse_flagged_at
     OR NEW.share_coins IS DISTINCT FROM OLD.share_coins
  THEN
    RAISE EXCEPTION 'Cannot modify privilege/credit fields directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 4. Replace spoofable service-role checks with JWT-based checks
DROP POLICY IF EXISTS "Service role can insert analytics events" ON public.analytics_events;
CREATE POLICY "Service role can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can insert error logs" ON public.error_logs;
CREATE POLICY "Service role can insert error logs"
ON public.error_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can insert illustration logs" ON public.illustration_logs;
CREATE POLICY "Service role can insert illustration logs"
ON public.illustration_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can insert cover logs" ON public.cover_logs;
CREATE POLICY "Service role can insert cover logs"
ON public.cover_logs FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can insert alerts" ON public.admin_alerts;
CREATE POLICY "Service role can insert alerts"
ON public.admin_alerts FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage coloring pages" ON public.story_coloring_pages;
CREATE POLICY "Service role can manage coloring pages"
ON public.story_coloring_pages FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 5. Revoke EXECUTE from anon/authenticated on internal/admin SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.get_admin_user_emails() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_public_story(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_public_book(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_story_slug() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_story_slug(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at() FROM anon, authenticated, public;
