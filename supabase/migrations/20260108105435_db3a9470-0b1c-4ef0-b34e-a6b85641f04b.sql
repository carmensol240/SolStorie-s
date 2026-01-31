-- Add share_coins and referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS share_coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- Index for faster lookups
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);