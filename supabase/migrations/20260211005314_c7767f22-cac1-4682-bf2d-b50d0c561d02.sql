
-- Create user_story_stats table for tracking story read counts
CREATE TABLE public.user_story_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  read_count INTEGER NOT NULL DEFAULT 1,
  last_read TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Enable RLS
ALTER TABLE public.user_story_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own stats
CREATE POLICY "Users can view their own stats"
ON public.user_story_stats
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert their own stats"
ON public.user_story_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update their own stats"
ON public.user_story_stats
FOR UPDATE
USING (auth.uid() = user_id);
