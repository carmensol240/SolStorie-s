ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS page1_regen_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS page1_regen_lock_at timestamptz;