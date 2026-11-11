CREATE OR REPLACE FUNCTION public.get_public_story(p_story_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  s record;
  v_purchased boolean;
  v_limit integer;
BEGIN
  IF p_story_id IS NULL OR length(p_story_id) = 0 THEN
    RETURN NULL;
  END IF;

  IF p_story_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT * INTO s FROM public.stories WHERE id = p_story_id::uuid;
  ELSE
    SELECT * INTO s FROM public.stories WHERE slug = p_story_id LIMIT 1;
  END IF;

  IF s.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Purchased = unlock record, or legacy credit story (keep date in sync with LEGACY_UNLOCK_CUTOFF).
  v_purchased := EXISTS (SELECT 1 FROM public.story_unlocks u WHERE u.story_id = s.id)
    OR (NOT s.is_taste AND s.user_id IS NOT NULL AND s.created_at < '2026-10-18T09:00:00Z'::timestamptz);

  IF v_purchased THEN
    v_limit := NULL;
  ELSE
    v_limit := CASE WHEN s.age_range = '0-2' THEN 5 ELSE 4 END;
    IF s.is_taste THEN
      v_limit := LEAST(v_limit, COALESCE(s.taste_page_limit, 0));
    END IF;
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
    'is_taste', s.is_taste,
    'is_purchased', v_purchased,
    'total_pages', (SELECT count(*) FROM public.story_pages sp WHERE sp.story_id = s.id),
    'pages', (
      SELECT jsonb_agg(jsonb_build_object(
          'page_number', sp.page_number,
          'text', sp.text,
          'illustration_url', sp.illustration_url
        ) ORDER BY sp.page_number)
      FROM public.story_pages sp
      WHERE sp.story_id = s.id
        AND (v_limit IS NULL OR sp.page_number <= v_limit)
    )
  ) INTO result;

  RETURN result;
END;
$function$;