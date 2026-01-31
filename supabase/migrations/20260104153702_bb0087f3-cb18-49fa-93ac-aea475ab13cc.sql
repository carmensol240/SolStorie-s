-- Create storage bucket for story illustrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-illustrations', 'story-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to illustrations
CREATE POLICY "Public can view story illustrations"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-illustrations');

-- Allow authenticated users to upload illustrations (for edge functions with service role)
CREATE POLICY "Service role can upload illustrations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-illustrations');

-- Allow service role to update illustrations
CREATE POLICY "Service role can update illustrations"
ON storage.objects FOR UPDATE
USING (bucket_id = 'story-illustrations');

-- Allow service role to delete illustrations
CREATE POLICY "Service role can delete illustrations"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-illustrations');