CREATE POLICY "Admins can view all redemptions"
ON public.coupon_redemptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));