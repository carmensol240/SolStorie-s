-- 1. Extend stories table with new columns
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS story_type TEXT DEFAULT 'text';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'adventure';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 10;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_daily_story BOOLEAN DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS daily_story_date DATE;

-- 2. Create user_settings table (anonymous, device-based for COPPA compliance)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  avatar_emoji TEXT DEFAULT '🦁',
  nickname TEXT DEFAULT 'חבר קטן',
  silent_mode BOOLEAN DEFAULT false,
  screen_time_limit INTEGER DEFAULT 60,
  age_filter_min INTEGER DEFAULT 0,
  age_filter_max INTEGER DEFAULT 10,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings (public access based on device_id)
CREATE POLICY "Allow public read access on user_settings"
ON public.user_settings FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access on user_settings"
ON public.user_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access on user_settings"
ON public.user_settings FOR UPDATE
USING (true);

-- 3. Create analytics_events table (anonymous tracking)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
  page_number INTEGER,
  time_spent_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_events (allow insert only, no read for privacy)
CREATE POLICY "Allow public insert access on analytics_events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- 4. Add UPDATE policy for stories table (was missing)
CREATE POLICY "Allow public update access on stories"
ON public.stories FOR UPDATE
USING (true);