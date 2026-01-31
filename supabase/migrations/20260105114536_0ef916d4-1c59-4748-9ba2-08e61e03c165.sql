-- Add sound_effects_enabled column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN sound_effects_enabled boolean DEFAULT true;