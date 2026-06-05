DROP POLICY IF EXISTS "Subscribers can view premium story pages" ON public.premium_story_pages;

CREATE POLICY "Users who unlocked can view premium story pages"
ON public.premium_story_pages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.story_unlocks su
    WHERE su.story_id = premium_story_pages.story_id
      AND su.user_id = auth.uid()
  )
);