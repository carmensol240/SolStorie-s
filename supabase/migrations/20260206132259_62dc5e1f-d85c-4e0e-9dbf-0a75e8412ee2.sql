-- Fix RLS policies for stories and story_pages tables
-- Remove the NULL user_id condition that exposes children's data publicly

-- First, drop the existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own stories or public stories" ON public.stories;
DROP POLICY IF EXISTS "Users can view pages of stories they can access" ON public.story_pages;

-- Create new secure policies for stories table
-- Only authenticated users can view their own stories
CREATE POLICY "Users can view their own stories"
ON public.stories FOR SELECT
USING (auth.uid() = user_id);

-- Create new secure policy for story_pages table
-- Users can only view pages of stories they own
CREATE POLICY "Users can view their own story pages"
ON public.story_pages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_pages.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- For public shared books (via digital_books with share_token), we use a function
-- that already exists: get_public_book. The story pages for shared books are
-- accessed via that secure function, not direct RLS.

-- Note: Stories with NULL user_id (dev mode) will no longer be publicly visible
-- This is intentional for security - dev mode is for local testing only