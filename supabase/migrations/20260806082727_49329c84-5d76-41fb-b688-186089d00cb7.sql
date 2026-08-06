CREATE OR REPLACE FUNCTION public.sanitize_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce for inserts coming from an authenticated end-user via the Data API.
  -- handle_new_user (auth trigger), service-role edge functions and migrations
  -- run with auth.uid() = NULL and are left untouched.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.story_credits := 0;
  NEW.coloring_credits := 0;
  NEW.editing_credits := 0;
  NEW.share_coins := 0;
  NEW.free_edits_remaining := 0;
  NEW.free_edits_total := 0;
  NEW.daily_edit_credits := 0;
  NEW.is_subscriber := false;
  NEW.first_purchase_bonus_given := false;
  NEW.education_bonus_claimed := false;
  NEW.commercial_abuse_flagged := false;
  NEW.commercial_abuse_flagged_at := NULL;

  IF NEW.user_role IS NULL OR NEW.user_role NOT IN ('parent', 'educator') THEN
    NEW.user_role := 'parent';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_profile_insert_trg ON public.profiles;
CREATE TRIGGER sanitize_profile_insert_trg
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sanitize_profile_insert();

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);