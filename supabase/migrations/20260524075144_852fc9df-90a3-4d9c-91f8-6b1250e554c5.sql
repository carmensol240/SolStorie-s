
-- 1. Strengthen profiles UPDATE policy to also protect daily_edit_credits and last_edit_credits_reset
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_subscriber = (SELECT p.is_subscriber FROM public.profiles p WHERE p.id = auth.uid())
  AND NOT (story_credits IS DISTINCT FROM (SELECT p.story_credits FROM public.profiles p WHERE p.id = auth.uid()))
  AND user_role = (SELECT p.user_role FROM public.profiles p WHERE p.id = auth.uid())
  AND NOT (editing_credits IS DISTINCT FROM (SELECT p.editing_credits FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (coloring_credits IS DISTINCT FROM (SELECT p.coloring_credits FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (free_edits_remaining IS DISTINCT FROM (SELECT p.free_edits_remaining FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (free_edits_total IS DISTINCT FROM (SELECT p.free_edits_total FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (share_coins IS DISTINCT FROM (SELECT p.share_coins FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (commercial_abuse_flagged IS DISTINCT FROM (SELECT p.commercial_abuse_flagged FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (daily_edit_credits IS DISTINCT FROM (SELECT p.daily_edit_credits FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (last_edit_credits_reset IS DISTINCT FROM (SELECT p.last_edit_credits_reset FROM public.profiles p WHERE p.id = auth.uid()))
);

-- 2. Block anonymous and authenticated users from inserting analytics_events directly.
-- Only service_role (used by edge functions) may insert.
CREATE POLICY "Deny direct inserts from anon and authenticated"
ON public.analytics_events
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);
