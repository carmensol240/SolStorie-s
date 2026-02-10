
-- Add personalization fields to children table
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS challenges TEXT,
ADD COLUMN IF NOT EXISTS favorite_friends TEXT;

-- Create parent_notes table for the parent's magic notebook
CREATE TABLE IF NOT EXISTS public.parent_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discussion_topics TEXT DEFAULT '',
  goals_reinforcements TEXT DEFAULT '',
  magic_moments TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one notes row per user
ALTER TABLE public.parent_notes ADD CONSTRAINT parent_notes_user_unique UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.parent_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notes"
ON public.parent_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON public.parent_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
ON public.parent_notes FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_parent_notes_updated_at
BEFORE UPDATE ON public.parent_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
