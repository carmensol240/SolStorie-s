-- Update the SELECT policy to also allow viewing stories with NULL user_id
-- This enables dev mode and anonymous story viewing

DROP POLICY IF EXISTS "Users can view their own stories" ON public.stories;

CREATE POLICY "Users can view their own stories or public stories" 
ON public.stories 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
);

-- Also update story_pages to match
DROP POLICY IF EXISTS "Users can view pages of their stories" ON public.story_pages;

CREATE POLICY "Users can view pages of stories they can access" 
ON public.story_pages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_pages.story_id 
    AND ((auth.uid() = stories.user_id) OR (stories.user_id IS NULL))
  )
);