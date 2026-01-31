-- First create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add is_subscriber column to profiles for manual subscription management
ALTER TABLE public.profiles 
ADD COLUMN is_subscriber boolean NOT NULL DEFAULT false;

-- Create digital_books table for shareable flipbook versions
CREATE TABLE public.digital_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  dedication_text text,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_uuid()::text::bytea, 'hex'),
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_books ENABLE ROW LEVEL SECURITY;

-- Policies for digital_books
CREATE POLICY "Users can view their own digital books"
ON public.digital_books
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital books"
ON public.digital_books
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital books"
ON public.digital_books
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own digital books"
ON public.digital_books
FOR DELETE
USING (auth.uid() = user_id);

-- Public can view shared digital books via share_token
CREATE POLICY "Anyone can view public digital books"
ON public.digital_books
FOR SELECT
USING (is_public = true);

-- Add trigger for updated_at
CREATE TRIGGER update_digital_books_updated_at
BEFORE UPDATE ON public.digital_books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();