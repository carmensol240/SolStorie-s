ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS clothing_type TEXT,
  ADD COLUMN IF NOT EXISTS clothing_color TEXT;