CREATE TABLE public.blocked_email_domains (domain text PRIMARY KEY);
GRANT ALL ON public.blocked_email_domains TO service_role;
ALTER TABLE public.blocked_email_domains ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_disposable_email(p_email text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d text; parts text[]; i int;
BEGIN
  d := lower(split_part(trim(coalesce(p_email,'')), '@', 2));
  IF d = '' THEN RETURN false; END IF;
  IF d ~ '(mailosaur|guerrillamail|mailinator|yopmail|tempmail|temp-mail|10minutemail|throwaway|trashmail)' THEN RETURN true; END IF;
  parts := string_to_array(d, '.');
  FOR i IN 1..greatest(array_length(parts,1)-1,1) LOOP
    IF EXISTS (SELECT 1 FROM public.blocked_email_domains WHERE domain = array_to_string(parts[i:], '.')) THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.is_disposable_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_disposable_email(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name text;
  user_role_val text;
BEGIN
  -- Accounts are created only by email code (no password) or Google. Password sign-ups are refused.
  IF coalesce(new.encrypted_password, '') <> '' THEN
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