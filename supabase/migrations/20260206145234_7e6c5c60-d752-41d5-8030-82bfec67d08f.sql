-- Add explicit RLS policies to DENY anonymous access to sensitive tables
-- This ensures unauthenticated users cannot access any user data

-- 1. Profiles table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- 2. Children table - deny anonymous SELECT  
CREATE POLICY "Deny anonymous access to children"
ON public.children FOR SELECT
TO anon
USING (false);

-- 3. Purchases table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to purchases"
ON public.purchases FOR SELECT
TO anon
USING (false);

-- 4. Referrals table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to referrals"
ON public.referrals FOR SELECT
TO anon
USING (false);

-- 5. Stories table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to stories"
ON public.stories FOR SELECT
TO anon
USING (false);

-- 6. Story pages table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to story_pages"
ON public.story_pages FOR SELECT
TO anon
USING (false);

-- 7. Digital books table - deny anonymous SELECT
CREATE POLICY "Deny anonymous access to digital_books"
ON public.digital_books FOR SELECT
TO anon
USING (false);