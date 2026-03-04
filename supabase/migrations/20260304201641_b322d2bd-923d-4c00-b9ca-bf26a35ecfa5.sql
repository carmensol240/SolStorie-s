ALTER TABLE public.story_pages
ADD COLUMN IF NOT EXISTS illustration_prompt_2 text,
ADD COLUMN IF NOT EXISTS illustration_url_2 text;