-- Add avatar_url column to children table to store the AI-generated 3D character
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add daily_edit_credits and last_edit_credits_reset to profiles table for subscriber editing limits
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_edit_credits integer DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_edit_credits_reset timestamp with time zone DEFAULT now();

-- Comment for clarity
COMMENT ON COLUMN public.children.avatar_url IS 'AI-generated 3D Disney-Pixar style avatar from child photo';
COMMENT ON COLUMN public.profiles.daily_edit_credits IS 'Remaining daily edit credits for subscribers (resets every 24 hours)';
COMMENT ON COLUMN public.profiles.last_edit_credits_reset IS 'Timestamp of last daily edit credits reset';