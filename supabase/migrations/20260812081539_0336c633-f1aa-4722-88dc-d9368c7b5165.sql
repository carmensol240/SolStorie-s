CREATE POLICY "Restrict premium_story_pages to unlocked users or admins"
ON public.premium_story_pages
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.story_unlocks su
    WHERE su.story_id = premium_story_pages.story_id
      AND su.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.story_unlocks su
    WHERE su.story_id = premium_story_pages.story_id
      AND su.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);