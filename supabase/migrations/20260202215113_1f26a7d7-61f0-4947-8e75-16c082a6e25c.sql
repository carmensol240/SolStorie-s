-- Remove the old duplicate policy that was not dropped
DROP POLICY IF EXISTS "Users can view pages of their own stories" ON public.story_pages;