-- Fix premium_story_pages RLS policy - restrict to subscribers only
-- This prevents non-subscribers from accessing premium content directly from the database

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view premium story pages" ON premium_story_pages;

-- Create subscriber-only policy for premium story pages
CREATE POLICY "Subscribers can view premium story pages"
ON premium_story_pages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_subscriber = true
  )
);

-- Add admin override policy for premium story pages
CREATE POLICY "Admins can view all premium pages"
ON premium_story_pages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));