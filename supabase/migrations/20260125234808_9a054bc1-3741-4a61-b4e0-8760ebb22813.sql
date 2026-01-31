-- Update storage policies for child-photos bucket to use folder structure
DROP POLICY IF EXISTS "Users can upload child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their child photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their child photos" ON storage.objects;

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload child photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update files in their own folder
CREATE POLICY "Users can update their child photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete files in their own folder
CREATE POLICY "Users can delete their child photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);