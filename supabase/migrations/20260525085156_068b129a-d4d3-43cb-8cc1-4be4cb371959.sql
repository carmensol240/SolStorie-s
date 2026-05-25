DROP POLICY IF EXISTS "Anyone can signup" ON public.maintenance_signups;

CREATE POLICY "Anyone can signup with valid email"
ON public.maintenance_signups
FOR INSERT
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);