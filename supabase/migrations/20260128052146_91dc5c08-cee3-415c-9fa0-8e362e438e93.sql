-- =============================================
-- CRITICAL SECURITY FIX: story_pages RLS
-- =============================================
-- Drop existing open policies
DROP POLICY IF EXISTS "Allow public delete access on story_pages" ON public.story_pages;
DROP POLICY IF EXISTS "Allow public insert access on story_pages" ON public.story_pages;
DROP POLICY IF EXISTS "Allow public read access on story_pages" ON public.story_pages;
DROP POLICY IF EXISTS "Allow public update access on story_pages" ON public.story_pages;

-- Create secure policies that check story ownership
CREATE POLICY "Users can view pages of their own stories"
ON public.story_pages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert pages to their own stories"
ON public.story_pages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update pages of their own stories"
ON public.story_pages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete pages of their own stories"
ON public.story_pages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stories
    WHERE stories.id = story_pages.story_id
    AND stories.user_id = auth.uid()
  )
);