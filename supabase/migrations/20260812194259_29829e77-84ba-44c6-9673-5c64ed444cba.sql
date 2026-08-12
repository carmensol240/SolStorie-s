ALTER TABLE public.profiles DISABLE TRIGGER prevent_profile_privilege_escalation_trg;

UPDATE public.profiles
SET story_credits = story_credits + 1
WHERE id = 'a3f3710e-7afa-44d8-a934-62d5b3227a0d';

ALTER TABLE public.profiles ENABLE TRIGGER prevent_profile_privilege_escalation_trg;