-- Add gender column to children table
ALTER TABLE public.children 
ADD COLUMN gender text DEFAULT 'male';

-- Add child_gender column to stories table
ALTER TABLE public.stories 
ADD COLUMN child_gender text DEFAULT 'male';