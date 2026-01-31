-- Add INSERT, UPDATE, DELETE policies for premium_stories (admin management)
-- For now, allowing public access since there's no admin role system yet
-- TODO: In production, add proper admin role check

CREATE POLICY "Allow insert on premium_stories"
ON public.premium_stories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update on premium_stories"
ON public.premium_stories
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete on premium_stories"
ON public.premium_stories
FOR DELETE
USING (true);

-- Add INSERT, UPDATE, DELETE policies for premium_story_pages
CREATE POLICY "Allow insert on premium_story_pages"
ON public.premium_story_pages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update on premium_story_pages"
ON public.premium_story_pages
FOR UPDATE
USING (true);

CREATE POLICY "Allow delete on premium_story_pages"
ON public.premium_story_pages
FOR DELETE
USING (true);