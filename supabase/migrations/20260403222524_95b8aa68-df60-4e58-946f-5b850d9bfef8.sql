
-- New table for caching coloring pages
CREATE TABLE public.story_coloring_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  user_id uuid NOT NULL,
  illustration_url text NOT NULL,
  coloring_image_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.story_coloring_pages ENABLE ROW LEVEL SECURITY;

-- Users can view their own cached coloring pages
CREATE POLICY "Users can view own coloring pages"
ON public.story_coloring_pages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own coloring pages
CREATE POLICY "Users can insert own coloring pages"
ON public.story_coloring_pages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all coloring pages"
ON public.story_coloring_pages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (for edge function)
CREATE POLICY "Service role can manage coloring pages"
ON public.story_coloring_pages FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Add coloring_credits to profiles
ALTER TABLE public.profiles ADD COLUMN coloring_credits integer DEFAULT 0;
