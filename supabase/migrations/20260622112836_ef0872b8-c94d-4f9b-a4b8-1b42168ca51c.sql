
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education_bonus_claimed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  safe_display_name text;
  user_role_val text;
  initial_story_credits integer;
  initial_coloring_credits integer;
  bonus_claimed boolean;
BEGIN
  safe_display_name := new.raw_user_meta_data ->> 'display_name';

  IF safe_display_name IS NOT NULL THEN
    safe_display_name := left(safe_display_name, 100);
    safe_display_name := regexp_replace(safe_display_name, '[^\u0590-\u05FF\u0041-\u007Aa-zA-Z0-9\s\-]', '', 'g');
    safe_display_name := trim(safe_display_name);
    IF safe_display_name = '' THEN
      safe_display_name := NULL;
    END IF;
  END IF;

  user_role_val := COALESCE(new.raw_user_meta_data ->> 'user_role', 'parent');
  IF user_role_val NOT IN ('parent', 'educator') THEN
    user_role_val := 'parent';
  END IF;

  IF user_role_val = 'educator' THEN
    initial_story_credits := 1;
    initial_coloring_credits := 1;
    bonus_claimed := true;
  ELSE
    initial_story_credits := 1;
    initial_coloring_credits := 0;
    bonus_claimed := false;
  END IF;

  INSERT INTO public.profiles (
    id, display_name, story_credits, coloring_credits, user_role, email, education_bonus_claimed
  )
  VALUES (
    new.id, safe_display_name, initial_story_credits, initial_coloring_credits,
    user_role_val, new.email, bonus_claimed
  );

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_subscriber IS DISTINCT FROM OLD.is_subscriber
     OR NEW.story_credits IS DISTINCT FROM OLD.story_credits
     OR NEW.user_role IS DISTINCT FROM OLD.user_role
     OR NEW.editing_credits IS DISTINCT FROM OLD.editing_credits
     OR NEW.coloring_credits IS DISTINCT FROM OLD.coloring_credits
     OR NEW.free_edits_remaining IS DISTINCT FROM OLD.free_edits_remaining
     OR NEW.free_edits_total IS DISTINCT FROM OLD.free_edits_total
     OR NEW.daily_edit_credits IS DISTINCT FROM OLD.daily_edit_credits
     OR NEW.last_edit_credits_reset IS DISTINCT FROM OLD.last_edit_credits_reset
     OR NEW.commercial_abuse_flagged IS DISTINCT FROM OLD.commercial_abuse_flagged
     OR NEW.commercial_abuse_flagged_at IS DISTINCT FROM OLD.commercial_abuse_flagged_at
     OR NEW.share_coins IS DISTINCT FROM OLD.share_coins
     OR NEW.first_purchase_bonus_given IS DISTINCT FROM OLD.first_purchase_bonus_given
     OR NEW.education_bonus_claimed IS DISTINCT FROM OLD.education_bonus_claimed
  THEN
    RAISE EXCEPTION 'Cannot modify privilege/credit fields directly';
  END IF;

  RETURN NEW;
END;
$function$;
