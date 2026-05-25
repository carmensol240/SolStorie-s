
-- coupons: restrict SELECT to admins only
CREATE POLICY "Restrict coupons SELECT to admins"
ON public.coupons
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- maintenance_signups: restrict SELECT to admins only
CREATE POLICY "Restrict maintenance_signups SELECT to admins"
ON public.maintenance_signups
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- premium_story_pages: deny anonymous SELECT
CREATE POLICY "Deny anonymous access to premium_story_pages"
ON public.premium_story_pages
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- referrals: restrict SELECT to owners or admins
CREATE POLICY "Restrict referrals SELECT to owner or admin"
ON public.referrals
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (auth.uid() = referrer_id OR public.has_role(auth.uid(), 'admin'::app_role));
