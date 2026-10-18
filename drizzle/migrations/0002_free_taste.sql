ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_taste boolean NOT NULL DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS taste_page_limit integer;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS taste_resume jsonb;

-- Only the server may change the free-taste fields.
CREATE OR REPLACE FUNCTION public.protect_story_taste_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (auth.jwt() ->> 'role') = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_taste := false;
    NEW.taste_page_limit := NULL;
    NEW.taste_resume := NULL;
    RETURN NEW;
  END IF;
  IF NEW.is_taste IS DISTINCT FROM OLD.is_taste
     OR NEW.taste_page_limit IS DISTINCT FROM OLD.taste_page_limit
     OR NEW.taste_resume IS DISTINCT FROM OLD.taste_resume THEN
    RAISE EXCEPTION 'Cannot modify free-taste fields directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_story_taste_fields_trg ON public.stories;
CREATE TRIGGER protect_story_taste_fields_trg
BEFORE INSERT OR UPDATE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.protect_story_taste_fields();

CREATE TABLE public.free_taste_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  normalized_email text,
  device_id text,
  ip_hash text,
  story_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.free_taste_claims TO service_role;
ALTER TABLE public.free_taste_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view free taste claims" ON public.free_taste_claims
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT ON public.free_taste_claims TO authenticated;
CREATE UNIQUE INDEX free_taste_claims_user_uq ON public.free_taste_claims(user_id);
CREATE UNIQUE INDEX free_taste_claims_email_uq ON public.free_taste_claims(normalized_email) WHERE normalized_email IS NOT NULL;
CREATE UNIQUE INDEX free_taste_claims_device_uq ON public.free_taste_claims(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX free_taste_claims_ip_idx ON public.free_taste_claims(ip_hash, created_at);

-- Locked pages of an unpaid taste story are never readable (admins excepted).
CREATE POLICY "Taste stories hide locked pages" ON public.story_pages
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR NOT EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_pages.story_id
        AND s.is_taste
        AND story_pages.page_number > COALESCE(s.taste_page_limit, 0)
    )
  );

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

  BEGIN
    resolved_id := p_story_id::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
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
    'is_taste', s.is_taste,
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
        AND (NOT s.is_taste OR sp.page_number <= COALESCE(s.taste_page_limit, 0))
    )
  ) INTO result
  FROM public.stories s
  WHERE s.id = resolved_id;

  RETURN result;
END;
$function$;