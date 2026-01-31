-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  age_range TEXT NOT NULL CHECK (age_range IN ('2-4', '5-7')),
  topic TEXT NOT NULL,
  nikud BOOLEAN NOT NULL DEFAULT true,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story_pages table
CREATE TABLE public.story_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  illustration_url TEXT,
  illustration_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster page lookups
CREATE INDEX idx_story_pages_story_id ON public.story_pages(story_id);

-- Enable Row Level Security (public access for MVP - no auth required)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_pages ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (for MVP without auth)
CREATE POLICY "Allow public read access on stories" 
ON public.stories 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access on stories" 
ON public.stories 
FOR DELETE 
USING (true);

CREATE POLICY "Allow public read access on story_pages" 
ON public.story_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access on story_pages" 
ON public.story_pages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access on story_pages" 
ON public.story_pages 
FOR DELETE 
USING (true);