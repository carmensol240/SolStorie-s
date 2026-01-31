-- Add edit_count column to stories table to track per-story edits
ALTER TABLE public.stories 
ADD COLUMN edit_count integer NOT NULL DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.stories.edit_count IS 'Tracks how many times the story has been edited. First edit (when 0) is free, subsequent edits cost 1 credit.';