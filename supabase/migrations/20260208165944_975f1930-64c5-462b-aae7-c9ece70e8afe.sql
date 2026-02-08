-- Phase 2 Migration: Avatar persistence + Explicit initial credit

-- 1. Add avatar_description column to children table for character consistency
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS avatar_description TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.children.avatar_description IS 'JSON string containing character visual profile (hair, eyes, skin, etc.) for consistent illustrations across stories';

-- 2. Set default story_credits to 1 for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN story_credits SET DEFAULT 1;

-- 3. Update handle_new_user function to explicitly set 1 credit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Insert new profile with explicit 1 credit for new users
  INSERT INTO public.profiles (id, display_name, story_credits)
  VALUES (new.id, safe_display_name, 1);
  
  RETURN new;
END;
$function$;