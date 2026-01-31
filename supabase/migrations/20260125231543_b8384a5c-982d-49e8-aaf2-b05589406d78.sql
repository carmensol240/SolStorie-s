-- Add user_id column to stories table for gallery privacy
ALTER TABLE public.stories 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update story_pages to allow updates (for editing feature)
CREATE POLICY "Allow public update access on story_pages" 
ON public.story_pages 
FOR UPDATE 
USING (true);

-- Drop existing overly permissive policies on stories
DROP POLICY IF EXISTS "Allow public delete access on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public insert access on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public read access on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow public update access on stories" ON public.stories;

-- Create proper user-scoped RLS policies for stories
CREATE POLICY "Users can view their own stories" 
ON public.stories 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);