-- Add photo_url column to children table
ALTER TABLE children 
ADD COLUMN photo_url text;

-- Create storage bucket for child photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('child-photos', 'child-photos', true);

-- RLS policies for child photos bucket
CREATE POLICY "Users can upload child photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'child-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view child photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'child-photos');

CREATE POLICY "Users can delete their child photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'child-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their child photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'child-photos' AND auth.uid() IS NOT NULL);