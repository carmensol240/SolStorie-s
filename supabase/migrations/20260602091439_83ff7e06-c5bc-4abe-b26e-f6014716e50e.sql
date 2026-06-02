CREATE POLICY "Admins can insert story unlocks"
ON public.story_unlocks
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));