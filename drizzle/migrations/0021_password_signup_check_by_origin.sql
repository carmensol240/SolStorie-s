CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name text;
  user_role_val text;
BEGIN
  -- Email accounts are created only by verify-login-code (app_metadata.via = 'login_code', settable only by the server);
  -- Google and other social providers are allowed. Password / magic-link sign-ups straight to auth are refused.
  IF coalesce(new.raw_app_meta_data->>'provider', 'email') = 'email'
     AND coalesce(new.raw_app_meta_data->>'via', '') <> 'login_code' THEN
    RAISE EXCEPTION 'password_signup_disabled';
  END IF;
  IF public.is_disposable_email(new.email) THEN
    RAISE EXCEPTION 'disposable_email';
  END IF;

  safe_display_name := new.raw_user_meta_data ->> 'display_name';
  IF safe_display_name IS NOT NULL THEN
    safe_display_name := left(safe_display_name, 100);
    safe_display_name := regexp_replace(safe_display_name, '[^\u0590-\u05FF\u0041-\u007Aa-zA-Z0-9\s\-]', '', 'g');
    safe_display_name := trim(safe_display_name);
    IF safe_display_name = '' THEN safe_display_name := NULL; END IF;
  END IF;

  user_role_val := COALESCE(new.raw_user_meta_data ->> 'user_role', 'parent');
  IF user_role_val NOT IN ('parent', 'educator') THEN user_role_val := 'parent'; END IF;

  INSERT INTO public.profiles (
    id, display_name, story_credits, coloring_credits, user_role, email,
    education_bonus_claimed, first_purchase_bonus_given
  ) VALUES (
    new.id, safe_display_name, 0, 0, user_role_val, new.email, false, false
  );
  RETURN new;
END;
$function$;