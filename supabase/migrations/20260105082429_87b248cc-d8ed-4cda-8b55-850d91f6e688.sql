-- Add terms acceptance tracking to profiles table
ALTER TABLE public.profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN terms_version TEXT;