DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;

CREATE POLICY "Service role can insert purchases"
ON public.purchases
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);