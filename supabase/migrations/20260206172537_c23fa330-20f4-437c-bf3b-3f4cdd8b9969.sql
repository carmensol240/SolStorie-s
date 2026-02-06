-- Make story-illustrations bucket private and add proper RLS policies

-- Step 1: Make the bucket private
UPDATE storage.buckets SET public = false WHERE name = 'story-illustrations';

-- Step 2: Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public read access for story illustrations" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view story illustrations" ON storage.objects;

-- Step 3: Authenticated users can view illustrations from their own stories
CREATE POLICY "Users view own story illustrations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'story-illustrations'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM stories
    WHERE stories.id::text = (storage.foldername(name))[1]
    AND stories.user_id = auth.uid()
  )
);

-- Step 4: Allow viewing illustrations for publicly shared books
CREATE POLICY "Public view shared story illustrations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'story-illustrations'
  AND EXISTS (
    SELECT 1 FROM stories s
    JOIN digital_books db ON db.story_id = s.id
    WHERE s.id::text = (storage.foldername(name))[1]
    AND db.is_public = true
  )
);

-- Step 5: Service role can manage all illustrations (for edge functions)
CREATE POLICY "Service role manages story illustrations"
ON storage.objects FOR ALL
USING (
  bucket_id = 'story-illustrations'
  AND (auth.jwt() ->> 'role') = 'service_role'
)
WITH CHECK (
  bucket_id = 'story-illustrations'
  AND (auth.jwt() ->> 'role') = 'service_role'
);