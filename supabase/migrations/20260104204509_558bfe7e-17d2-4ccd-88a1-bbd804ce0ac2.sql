-- Create children table for child profiles
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 0 AND age <= 18),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- RLS policies for children table
CREATE POLICY "Users can view their own children"
ON public.children
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own children"
ON public.children
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own children"
ON public.children
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own children"
ON public.children
FOR DELETE
USING (auth.uid() = user_id);

-- Add child_id to stories table
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES public.children(id) ON DELETE SET NULL;