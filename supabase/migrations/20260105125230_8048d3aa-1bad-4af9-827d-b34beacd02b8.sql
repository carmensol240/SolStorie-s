-- Create premium_stories table for pre-written stories
CREATE TABLE public.premium_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  theme TEXT DEFAULT 'adventure',
  min_age INTEGER DEFAULT 0,
  max_age INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create premium_story_pages table
CREATE TABLE public.premium_story_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.premium_stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  illustration_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_story_pages ENABLE ROW LEVEL SECURITY;

-- Everyone can read active premium stories (but content access controlled in app)
CREATE POLICY "Anyone can view active premium stories"
ON public.premium_stories
FOR SELECT
USING (is_active = true);

-- Anyone can view premium story pages (premium check done in app layer)
CREATE POLICY "Anyone can view premium story pages"
ON public.premium_story_pages
FOR SELECT
USING (true);

-- Create index for better performance
CREATE INDEX idx_premium_stories_display_order ON public.premium_stories(display_order);
CREATE INDEX idx_premium_story_pages_story_id ON public.premium_story_pages(story_id, page_number);