
-- Add slug column
ALTER TABLE public.stories ADD COLUMN slug text UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX idx_stories_slug ON public.stories (slug);

-- Function to generate a URL-friendly slug from Hebrew/English text
CREATE OR REPLACE FUNCTION public.generate_story_slug(p_child_name text, p_topic text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Transliterate: keep only alphanumeric and spaces, then replace spaces with hyphens
  -- For Hebrew names, we'll use the raw characters and clean them
  base_slug := lower(trim(p_child_name || ' ' || p_topic));
  
  -- Remove special characters, keep Hebrew, English, numbers, spaces, hyphens
  base_slug := regexp_replace(base_slug, '[^\u0590-\u05FFa-z0-9\s-]', '', 'g');
  
  -- Replace multiple spaces/hyphens with single hyphen
  base_slug := regexp_replace(trim(base_slug), '[\s-]+', '-', 'g');
  
  -- Trim to reasonable length
  base_slug := left(base_slug, 80);
  
  -- Remove trailing hyphens
  base_slug := regexp_replace(base_slug, '-+$', '');
  
  -- If empty, use a random fallback
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'story-' || left(gen_random_uuid()::text, 8);
  END IF;
  
  -- Check uniqueness and add counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.stories WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.set_story_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_story_slug(NEW.child_name, NEW.topic);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_set_story_slug
BEFORE INSERT ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.set_story_slug();

-- Backfill existing stories with slugs
UPDATE public.stories 
SET slug = public.generate_story_slug(child_name, topic)
WHERE slug IS NULL;
