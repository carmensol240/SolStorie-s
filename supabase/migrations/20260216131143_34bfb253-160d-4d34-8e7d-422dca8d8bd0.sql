-- Make the story-illustrations bucket public so covers and illustrations can be accessed via public URLs
UPDATE storage.buckets SET public = true WHERE id = 'story-illustrations';

-- Add a public SELECT policy so anyone can view the illustrations
CREATE POLICY "Public read access for story illustrations"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-illustrations');