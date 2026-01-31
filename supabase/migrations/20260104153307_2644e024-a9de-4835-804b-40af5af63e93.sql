-- Drop the existing check constraint and recreate it with all valid age ranges
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_age_range_check;

ALTER TABLE public.stories ADD CONSTRAINT stories_age_range_check 
CHECK (age_range IN ('0-2', '2-4', '5-7', '8-10'));