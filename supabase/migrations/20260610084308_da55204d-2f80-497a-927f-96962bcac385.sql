
-- #4: Extend coupons to carry coloring credits + global PDF entitlement
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS extra_coloring_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grants_global_pdf boolean NOT NULL DEFAULT false;

-- Replace redeem_coupon_atomic to also grant coloring + global PDF when set
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(p_code text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_existing uuid;
  v_new_credits integer;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = upper(trim(p_code))
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'קוד קופון לא תקף');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'הקופון פג תוקף');
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.current_uses, 0) >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'הקופון מוצה');
  END IF;

  SELECT id INTO v_existing
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'כבר השתמשת בקופון זה');
  END IF;

  IF v_coupon.coupon_type = 'extra_stories' AND v_coupon.free_stories IS NOT NULL THEN
    UPDATE public.profiles
    SET story_credits     = COALESCE(story_credits, 0) + v_coupon.free_stories,
        coloring_credits  = COALESCE(coloring_credits, 0) + COALESCE(v_coupon.extra_coloring_credits, 0)
    WHERE id = p_user_id
    RETURNING story_credits INTO v_new_credits;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'שגיאה בטעינת הפרופיל');
    END IF;

    -- Grant a global (story_id NULL) PDF entitlement when the coupon allows.
    -- ON CONFLICT (user_id, story_id) handles the (rare) re-issue case.
    IF COALESCE(v_coupon.grants_global_pdf, false) THEN
      INSERT INTO public.pdf_entitlements (user_id, story_id, source, amount_paid)
      VALUES (p_user_id, NULL, 'gift_coupon:' || v_coupon.code, 0)
      ON CONFLICT (user_id, story_id) DO NOTHING;
    END IF;

  ELSIF v_coupon.coupon_type = 'discount' AND v_coupon.discount_percent IS NOT NULL THEN
    NULL;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'סוג קופון לא תקין');
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id)
  VALUES (v_coupon.id, p_user_id);

  UPDATE public.coupons
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_type', v_coupon.coupon_type,
    'value', CASE
      WHEN v_coupon.coupon_type = 'extra_stories' THEN v_coupon.free_stories
      ELSE v_coupon.discount_percent
    END,
    'code', v_coupon.code
  );
END;
$function$;

-- #5: Daily cron to mark stale pending_gifts as expired (>2h old, still pending)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-pending-gifts') THEN
    PERFORM cron.unschedule('expire-stale-pending-gifts');
  END IF;
END $$;

SELECT cron.schedule(
  'expire-stale-pending-gifts',
  '15 3 * * *', -- daily at 03:15 UTC
  $$
    UPDATE public.pending_gifts
    SET status = 'expired'
    WHERE status = 'pending'
      AND created_at < now() - interval '2 hours';
  $$
);
