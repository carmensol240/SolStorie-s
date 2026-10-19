ALTER TABLE public.story_pages ADD COLUMN IF NOT EXISTS print_illustration_url text;
ALTER TABLE public.story_pages ADD COLUMN IF NOT EXISTS print_illustration_width integer;