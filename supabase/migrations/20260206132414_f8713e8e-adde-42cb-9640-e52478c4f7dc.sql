-- Drop remaining old permissive policies that still exist
DROP POLICY IF EXISTS "Users can view their own stories or public stories" ON public.stories;
DROP POLICY IF EXISTS "Users can view pages of stories they can access" ON public.story_pages;

-- Also ensure the stories INSERT policy doesn't allow NULL user_id in production
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;

-- Recreate secure INSERT policy for stories - require authenticated user
CREATE POLICY "Users can create their own stories"
ON public.stories FOR INSERT
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Check if the new SELECT policies exist, if not create them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stories' AND policyname = 'Users can view their own stories'
  ) THEN
    CREATE POLICY "Users can view their own stories"
    ON public.stories FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'story_pages' AND policyname = 'Users can view their own story pages'
  ) THEN
    CREATE POLICY "Users can view their own story pages"
    ON public.story_pages FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.stories 
        WHERE stories.id = story_pages.story_id 
        AND stories.user_id = auth.uid()
      )
    );
  END IF;
END
$$;