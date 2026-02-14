
-- Add user_role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'parent';

-- Update the handle_new_user trigger to support educator role with 3 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name text;
  user_role_val text;
  initial_credits integer;
BEGIN
  -- Validate and sanitize display_name from user metadata
  safe_display_name := new.raw_user_meta_data ->> 'display_name';
  
  IF safe_display_name IS NOT NULL THEN
    safe_display_name := left(safe_display_name, 100);
    safe_display_name := regexp_replace(safe_display_name, '[^\u0590-\u05FF\u0041-\u007Aa-zA-Z0-9\s\-]', '', 'g');
    safe_display_name := trim(safe_display_name);
    IF safe_display_name = '' THEN
      safe_display_name := NULL;
    END IF;
  END IF;

  -- Get user role from metadata, default to 'parent'
  user_role_val := COALESCE(new.raw_user_meta_data ->> 'user_role', 'parent');
  IF user_role_val NOT IN ('parent', 'educator') THEN
    user_role_val := 'parent';
  END IF;

  -- Educators get 3 credits, parents get 1
  IF user_role_val = 'educator' THEN
    initial_credits := 3;
  ELSE
    initial_credits := 1;
  END IF;

  INSERT INTO public.profiles (id, display_name, story_credits, user_role)
  VALUES (new.id, safe_display_name, initial_credits, user_role_val);
  
  RETURN new;
END;
$function$;
