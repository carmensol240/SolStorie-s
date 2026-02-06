-- Add generation_status column to stories table for tracking illustration generation progress
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'ready';

-- Add comment for documentation
COMMENT ON COLUMN public.stories.generation_status IS 'Status of story generation: generating_text, generating_illustrations, ready, failed';