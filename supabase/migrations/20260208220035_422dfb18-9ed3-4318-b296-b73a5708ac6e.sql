-- =============================================
-- PDF Downloads Table - Track downloads for free user limit (3/month)
-- =============================================
CREATE TABLE public.pdf_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  story_id uuid NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/insert their own downloads
CREATE POLICY "Users can view own downloads"
  ON public.pdf_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON public.pdf_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient monthly count queries
CREATE INDEX idx_pdf_downloads_user_month ON public.pdf_downloads (user_id, downloaded_at);

-- =============================================
-- Coupons Table - Discount codes and extra story codes
-- =============================================
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  coupon_type text NOT NULL CHECK (coupon_type IN ('discount', 'extra_stories')),
  discount_percent integer CHECK (discount_percent IS NULL OR discount_percent IN (10, 15)),
  free_stories integer CHECK (free_stories IS NULL OR free_stories > 0),
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  expires_at timestamptz DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS - coupons are publicly readable (for validation) but only admin can modify
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (for validation)
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete coupons
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- Coupon Redemptions Table - Track which users used which coupons
-- =============================================
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  user_id uuid NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can insert own redemptions"
  ON public.coupon_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions (user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions (coupon_id);