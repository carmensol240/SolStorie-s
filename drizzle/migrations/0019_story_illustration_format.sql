ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS illustration_format text NOT NULL DEFAULT 'landscape';
ALTER TABLE public.stories ADD CONSTRAINT stories_illustration_format_check CHECK (illustration_format IN ('landscape','square'));
COMMENT ON COLUMN public.stories.illustration_format IS 'Picture shape for the whole story, decided once at creation (SQUARE_ILLUSTRATIONS switch).';