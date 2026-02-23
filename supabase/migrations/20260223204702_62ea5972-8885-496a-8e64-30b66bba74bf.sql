
-- Replace the slug generation function with a short alphanumeric slug generator
CREATE OR REPLACE FUNCTION public.generate_story_slug(p_child_name text, p_topic text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate a short 8-character alphanumeric slug from UUID
  base_slug := left(replace(encode(gen_random_uuid()::text::bytea, 'base64'), '/', ''), 8);
  -- Remove any non-alphanumeric characters and lowercase
  base_slug := lower(regexp_replace(base_slug, '[^a-z0-9]', '', 'g'));
  
  -- Ensure minimum length of 6
  IF length(base_slug) < 6 THEN
    base_slug := base_slug || left(md5(random()::text), 6 - length(base_slug));
  END IF;
  
  -- Check uniqueness
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.stories WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- Backfill all existing stories with short slugs
-- Only update stories that have Hebrew/non-ASCII slugs
UPDATE public.stories 
SET slug = left(lower(regexp_replace(
  replace(encode(gen_random_uuid()::text::bytea, 'base64'), '/', ''), 
  '[^a-z0-9]', '', 'g'
)), 8)
WHERE slug ~ '[^\x00-\x7F]' OR slug IS NULL;
