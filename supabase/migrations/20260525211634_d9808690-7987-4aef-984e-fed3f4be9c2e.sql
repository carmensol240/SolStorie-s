ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_purchase_bonus_given boolean NOT NULL DEFAULT false;

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
  THEN
    RAISE EXCEPTION 'Cannot modify privilege/credit fields directly';
  END IF;

  RETURN NEW;
END;
$function$;