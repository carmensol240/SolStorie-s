
-- Harden illustration_logs: add restrictive policy limiting SELECT to admins + service_role
CREATE POLICY "Restrict illustration_logs SELECT to admins"
ON public.illustration_logs
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tighten story_pages mutations to authenticated role only
DROP POLICY IF EXISTS "Users can insert pages to their own stories" ON public.story_pages;
DROP POLICY IF EXISTS "Users can update pages of their own stories" ON public.story_pages;
DROP POLICY IF EXISTS "Users can delete pages of their own stories" ON public.story_pages;

CREATE POLICY "Users can insert pages to their own stories"
ON public.story_pages
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stories
  WHERE stories.id = story_pages.story_id AND stories.user_id = auth.uid()
));

CREATE POLICY "Users can update pages of their own stories"
ON public.story_pages
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.stories
  WHERE stories.id = story_pages.story_id AND stories.user_id = auth.uid()
));

CREATE POLICY "Users can delete pages of their own stories"
ON public.story_pages
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.stories
  WHERE stories.id = story_pages.story_id AND stories.user_id = auth.uid()
));
