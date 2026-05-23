
-- 1) Coupons: restrict read to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

-- 2) Storage: drop unprotected service-role-ish policies on story-illustrations
DROP POLICY IF EXISTS "Service role can delete illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update story illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload story illustrations" ON storage.objects;

-- 3) Analytics events: allow admins to read
CREATE POLICY "Admins can view analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
