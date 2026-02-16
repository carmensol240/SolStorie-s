
-- Function to fetch story data publicly (read-only, no auth required)
CREATE OR REPLACE FUNCTION public.get_public_story(p_story_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Validate input
  IF p_story_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', s.id,
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
  WHERE s.id = p_story_id;

  RETURN result;
END;
$function$;
