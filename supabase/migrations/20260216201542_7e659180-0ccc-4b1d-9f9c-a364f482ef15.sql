ALTER TABLE public.profiles ADD COLUMN free_edits_remaining integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN free_edits_total integer DEFAULT 0;