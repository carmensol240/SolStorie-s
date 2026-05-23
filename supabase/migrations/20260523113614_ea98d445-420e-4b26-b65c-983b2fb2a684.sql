-- analytics_events: replace permissive public INSERT policy with service-role-only
DROP POLICY IF EXISTS "Service role can insert analytics events" ON public.analytics_events;
CREATE POLICY "Service role can insert analytics events"
ON public.analytics_events
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- error_logs: same tightening
DROP POLICY IF EXISTS "Service role can insert error logs" ON public.error_logs;
CREATE POLICY "Service role can insert error logs"
ON public.error_logs
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);