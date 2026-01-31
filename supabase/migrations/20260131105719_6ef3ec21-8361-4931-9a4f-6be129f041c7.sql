-- Make child-photos bucket public so avatar URLs work correctly
UPDATE storage.buckets SET public = true WHERE id = 'child-photos';

-- Add RLS policy for public SELECT on child-photos bucket
CREATE POLICY "Anyone can view child photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'child-photos');