-- Complete lockdown of user_settings - all access via edge functions only
-- Drop all existing policies on user_settings
DROP POLICY IF EXISTS "Update own device settings only" ON public.user_settings;
DROP POLICY IF EXISTS "Anon can insert new device settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service role can manage user settings" ON public.user_settings;

-- Create policies that block all direct access from anon/authenticated users
-- Only service_role can access (used by edge functions)
CREATE POLICY "Service role only - settings" 
ON public.user_settings 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Lock down analytics_events SELECT - analytics are write-only for anon users
-- Reading should be admin-only via service role
DROP POLICY IF EXISTS "Allow public insert access on analytics_events" ON public.analytics_events;

CREATE POLICY "Anon can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can read analytics" 
ON public.analytics_events 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'service_role');