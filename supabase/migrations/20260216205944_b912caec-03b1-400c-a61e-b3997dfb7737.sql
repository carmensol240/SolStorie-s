
-- Update get_public_story to accept either UUID or slug
CREATE OR REPLACE FUNCTION public.get_public_story(p_story_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  resolved_id uuid;
BEGIN
  IF p_story_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try to parse as UUID first
  BEGIN
    resolved_id := p_story_id::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Not a UUID, treat as slug
    SELECT id INTO resolved_id FROM public.stories WHERE slug = p_story_id LIMIT 1;
  END;

  IF resolved_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
    'slug', s.slug,
    'child_name', s.child_name,
    'topic', s.topic,
    'age_range', s.age_range,
    'language', s.language,
    'cover_url', s.cover_url,
    'child_gender', s.child_gender,
    'pages', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'page_number', sp.page_number,
          'text', sp.text,
          'illustration_url', sp.illustration_url
        ) ORDER BY sp.page_number
      )
      FROM public.story_pages sp
      WHERE sp.story_id = s.id
    )
  ) INTO result
  FROM public.stories s
  WHERE s.id = resolved_id;

  RETURN result;
END;
$function$;
