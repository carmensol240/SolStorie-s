ALTER TABLE public.profiles DISABLE TRIGGER prevent_profile_privilege_escalation_trg;

UPDATE public.profiles
SET story_credits = COALESCE(story_credits, 0) + 3
WHERE id = '49cd7676-ab96-496b-9287-61a9d67d3e68';

ALTER TABLE public.profiles ENABLE TRIGGER prevent_profile_privilege_escalation_trg;