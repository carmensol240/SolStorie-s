-- Make child-photos bucket private and update storage policies
-- This fixes the STORAGE_EXPOSURE security issue

-- Update bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'child-photos';

-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view child photos" ON storage.objects;

-- Create new RLS policies for child-photos bucket

-- Users can view their own photos (files in their user_id folder)
CREATE POLICY "Users can view own child photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload to their own folder
CREATE POLICY "Users can upload own child photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own photos
CREATE POLICY "Users can update own child photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own child photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'child-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);