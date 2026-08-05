-- 1. Replace no-op restrictive policies with real ones
DROP POLICY IF EXISTS "Deny anonymous access to children" ON public.children;
CREATE POLICY "Deny anonymous access to children" ON public.children
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Deny anonymous access to stories" ON public.stories;
CREATE POLICY "Deny anonymous access to stories" ON public.stories
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Deny anonymous access to story_pages" ON public.story_pages;
CREATE POLICY "Deny anonymous access to story_pages" ON public.story_pages
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
CREATE POLICY "Deny anonymous access to profiles" ON public.profiles
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Deny anonymous access to purchases" ON public.purchases;
CREATE POLICY "Deny anonymous access to purchases" ON public.purchases
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Align stories permissive policies to authenticated only
DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
CREATE POLICY "Users can view their own stories" ON public.stories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. child-photos storage: enforce auth + owner-folder convention explicitly
DROP POLICY IF EXISTS "Users can upload own child photos" ON storage.objects;
CREATE POLICY "Users can upload own child photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'child-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND array_length(storage.foldername(name), 1) >= 1
  );

DROP POLICY IF EXISTS "Users can view their own child photos" ON storage.objects;
CREATE POLICY "Users can view their own child photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'child-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own child photos" ON storage.objects;
CREATE POLICY "Users can update own child photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'child-photos' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'child-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own child photos" ON storage.objects;
CREATE POLICY "Users can delete own child photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'child-photos' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- Restrictive guard scoped to the child-photos bucket only
DROP POLICY IF EXISTS "Child photos require authenticated owner" ON storage.objects;
CREATE POLICY "Child photos require authenticated owner" ON storage.objects
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (
    bucket_id <> 'child-photos'
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = (auth.uid())::text)
  )
  WITH CHECK (
    bucket_id <> 'child-photos'
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = (auth.uid())::text)
  );