-- Fix RLS policies for stories table - remove NULL user_id access
DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

-- Create strict RLS policies - users can ONLY see their own stories
CREATE POLICY "Users can view their own stories" 
ON public.stories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);