-- Service role bypasses RLS; these rules were redundant.
DROP POLICY IF EXISTS "Service role manages story illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload topic images" ON storage.objects;
-- Public bucket serves direct links without a SELECT rule; this only enabled anonymous listing.
DROP POLICY IF EXISTS "Public view shared story illustrations" ON storage.objects;
-- Folder names are story IDs, not user IDs; rule was meaningless.
DROP POLICY IF EXISTS "Users can view their own story illustrations" ON storage.objects;
-- Owners may still list their own story folders, signed-in only.
DROP POLICY IF EXISTS "Users view own story illustrations" ON storage.objects;
CREATE POLICY "Users view own story illustrations" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'story-illustrations'
    AND EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id::text = (storage.foldername(objects.name))[1]
        AND stories.user_id = auth.uid()
    )
  );