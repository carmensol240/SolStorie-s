-- Restrict analytics_events INSERT to service_role only (forces all analytics through edge function)
-- Drop the overly permissive anon INSERT policy
DROP POLICY IF EXISTS "Anon can insert analytics events" ON public.analytics_events;

-- Create restrictive policy that only allows service_role to insert
CREATE POLICY "Service role can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK ((current_setting('role') = 'service_role'));

-- Update handle_new_user() to add display_name validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_display_name text;
BEGIN
  -- Validate and sanitize display_name from user metadata
  -- Limit to 100 characters and allow only safe characters (Hebrew, English, numbers, spaces, hyphens)
  safe_display_name := new.raw_user_meta_data ->> 'display_name';
  
  -- Enforce length limit
  IF safe_display_name IS NOT NULL THEN
    safe_display_name := left(safe_display_name, 100);
    -- Remove potentially dangerous characters (only allow letters, numbers, spaces, hyphens)
    safe_display_name := regexp_replace(safe_display_name, '[^\u0590-\u05FF\u0041-\u007Aa-zA-Z0-9\s\-]', '', 'g');
    -- Trim whitespace
    safe_display_name := trim(safe_display_name);
    -- Set to null if empty after sanitization
    IF safe_display_name = '' THEN
      safe_display_name := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, safe_display_name);
  RETURN new;
END;
$$;