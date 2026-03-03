
-- Fix story_pages SELECT RLS
DROP POLICY IF EXISTS "Deny anonymous access to story_pages" ON public.story_pages;
DROP POLICY IF EXISTS "Users can view their own story pages" ON public.story_pages;

CREATE POLICY "Users can view their own story pages"
  ON public.story_pages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_pages.story_id AND stories.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all story pages"
  ON public.story_pages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anonymous access to story_pages"
  ON public.story_pages AS RESTRICTIVE FOR SELECT TO authenticated
  USING (true);

-- Fix children SELECT RLS
DROP POLICY IF EXISTS "Deny anonymous access to children" ON public.children;
DROP POLICY IF EXISTS "Users can view their own children" ON public.children;

CREATE POLICY "Users can view their own children"
  ON public.children FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all children"
  ON public.children FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anonymous access to children"
  ON public.children AS RESTRICTIVE FOR SELECT TO authenticated
  USING (true);

-- Fix profiles SELECT RLS
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (true);

-- Fix purchases SELECT RLS
DROP POLICY IF EXISTS "Deny anonymous access to purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;

CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny anonymous access to purchases"
  ON public.purchases AS RESTRICTIVE FOR SELECT TO authenticated
  USING (true);
