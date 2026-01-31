-- Add personality_traits column to children table
ALTER TABLE public.children 
ADD COLUMN personality_traits TEXT DEFAULT NULL;