-- Add story credits column to profiles (new users get 1 free credit)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS story_credits INTEGER DEFAULT 1;

-- Create purchases table for tracking credit purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  package_name TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL,
  amount_ils DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);