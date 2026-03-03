
DROP POLICY IF EXISTS "Deny anonymous access to stories" ON public.stories;
CREATE POLICY "Deny anonymous access to stories"
  ON public.stories AS RESTRICTIVE FOR SELECT TO authenticated
  USING (true);
