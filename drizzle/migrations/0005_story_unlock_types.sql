ALTER TABLE public.story_unlocks DROP CONSTRAINT story_unlocks_unlock_type_check;
ALTER TABLE public.story_unlocks ADD CONSTRAINT story_unlocks_unlock_type_check
  CHECK (unlock_type IN ('single','bundled_free','admin_manual','taste','credit_digital','credit_full','legacy_digital'));