ALTER TABLE public.illustration_logs
  ADD COLUMN IF NOT EXISTS had_page1_reference boolean,
  ADD COLUMN IF NOT EXISTS camera_angle text,
  ADD COLUMN IF NOT EXISTS attempts integer,
  ADD COLUMN IF NOT EXISTS identity_check text,
  ADD COLUMN IF NOT EXISTS identity_retried boolean NOT NULL DEFAULT false;