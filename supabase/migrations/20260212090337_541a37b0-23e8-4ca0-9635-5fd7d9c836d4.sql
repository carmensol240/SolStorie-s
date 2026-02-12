
-- Create public bucket for AI-generated topic gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('topic-images', 'topic-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to topic images
CREATE POLICY "Topic images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'topic-images');

-- Allow service role to upload topic images (via edge function)
CREATE POLICY "Service role can upload topic images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'topic-images');
