-- 1. Remove purchases and story_pages from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.purchases;
ALTER PUBLICATION supabase_realtime DROP TABLE public.story_pages;

-- 2. Remove client-side INSERT on coupon_redemptions (service role / edge function only)
DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Service role manages coupon redemptions"
ON public.coupon_redemptions
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 3. Remove client-side INSERT on story_unlocks (service role only via verify-purchase)
DROP POLICY IF EXISTS "Users can insert their own unlocks" ON public.story_unlocks;

-- 4. Fix topic-images upload policy to require service_role
DROP POLICY IF EXISTS "Service role can upload topic images" ON storage.objects;
CREATE POLICY "Service role can upload topic images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'topic-images'
  AND (auth.jwt() ->> 'role') = 'service_role'
);

-- 5. Harden profiles UPDATE with WITH CHECK preventing privilege escalation at policy level
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_subscriber = (SELECT is_subscriber FROM public.profiles WHERE id = auth.uid())
  AND story_credits IS NOT DISTINCT FROM (SELECT story_credits FROM public.profiles WHERE id = auth.uid())
  AND user_role = (SELECT user_role FROM public.profiles WHERE id = auth.uid())
  AND editing_credits IS NOT DISTINCT FROM (SELECT editing_credits FROM public.profiles WHERE id = auth.uid())
  AND coloring_credits IS NOT DISTINCT FROM (SELECT coloring_credits FROM public.profiles WHERE id = auth.uid())
  AND free_edits_remaining IS NOT DISTINCT FROM (SELECT free_edits_remaining FROM public.profiles WHERE id = auth.uid())
  AND free_edits_total IS NOT DISTINCT FROM (SELECT free_edits_total FROM public.profiles WHERE id = auth.uid())
  AND share_coins IS NOT DISTINCT FROM (SELECT share_coins FROM public.profiles WHERE id = auth.uid())
  AND commercial_abuse_flagged IS NOT DISTINCT FROM (SELECT commercial_abuse_flagged FROM public.profiles WHERE id = auth.uid())
);