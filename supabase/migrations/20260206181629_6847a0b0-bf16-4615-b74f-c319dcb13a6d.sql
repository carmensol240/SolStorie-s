-- Fix 1: Ensure user_settings is restricted to service_role only (consolidate existing policies)
-- First drop existing permissive policies if they exist
DROP POLICY IF EXISTS "Users can update their own device settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can read their own device settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can create device settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete device settings" ON public.user_settings;

-- The "Service role only - settings" policy already exists and handles all operations
-- But let's ensure it's properly configured for all commands

-- Fix 2: Add input validation to get_public_book function
CREATE OR REPLACE FUNCTION public.get_public_book(p_share_token text)
 RETURNS TABLE(id uuid, story_id uuid, share_token text, is_public boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate token format: must be 32-64 character hex string
  IF p_share_token IS NULL OR NOT p_share_token ~ '^[a-f0-9]{32,64}$' THEN
    -- Return empty result for invalid tokens
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    db.id,
    db.story_id,
    db.share_token,
    db.is_public,
    db.created_at,
    db.updated_at
  FROM public.digital_books db
  WHERE db.share_token = p_share_token
    AND db.is_public = true;
END;
$function$;

-- Add CHECK constraints for valid value ranges on user_settings
ALTER TABLE public.user_settings 
  DROP CONSTRAINT IF EXISTS user_settings_age_filter_min_check,
  DROP CONSTRAINT IF EXISTS user_settings_age_filter_max_check,
  DROP CONSTRAINT IF EXISTS user_settings_screen_time_limit_check;

ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_age_filter_min_check CHECK (age_filter_min >= 0 AND age_filter_min <= 18),
  ADD CONSTRAINT user_settings_age_filter_max_check CHECK (age_filter_max >= 0 AND age_filter_max <= 18 AND age_filter_max >= age_filter_min),
  ADD CONSTRAINT user_settings_screen_time_limit_check CHECK (screen_time_limit >= 0 AND screen_time_limit <= 1440);