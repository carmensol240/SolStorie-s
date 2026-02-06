-- Make the story-illustrations bucket public so images can be displayed in the app
UPDATE storage.buckets 
SET public = true 
WHERE name = 'story-illustrations';

-- Create storage policy for public read access
CREATE POLICY "Public read access for story illustrations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'story-illustrations');

-- Create storage policy for service role uploads (edge functions)
CREATE POLICY "Service role can upload story illustrations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'story-illustrations');

-- Create storage policy for service role updates
CREATE POLICY "Service role can update story illustrations" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'story-illustrations');