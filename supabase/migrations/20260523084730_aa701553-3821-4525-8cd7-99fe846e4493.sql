CREATE TABLE public.story_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  unlock_type text NOT NULL CHECK (unlock_type IN ('single', 'bundled_free')),
  amount_paid numeric NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, story_id)
);

ALTER TABLE public.story_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlocks"
ON public.story_unlocks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlocks"
ON public.story_unlocks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages unlocks"
ON public.story_unlocks FOR ALL TO public
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can view all unlocks"
ON public.story_unlocks FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_story_unlocks_user_story ON public.story_unlocks(user_id, story_id);