
-- 1) Ensure handle_new_user trigger is attached (credits: parent=1, educator=2 already in function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Atomic coupon redemption with row-level locking to prevent race conditions
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(
  p_code text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_existing uuid;
  v_new_credits integer;
BEGIN
  -- Lock the coupon row to prevent concurrent redemptions
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

  -- Check existing redemption for this user (locked context)
  SELECT id INTO v_existing
  FROM public.coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'כבר השתמשת בקופון זה');
  END IF;

  -- Apply effect
  IF v_coupon.coupon_type = 'extra_stories' AND v_coupon.free_stories IS NOT NULL THEN
    UPDATE public.profiles
    SET story_credits = COALESCE(story_credits, 0) + v_coupon.free_stories
    WHERE id = p_user_id
    RETURNING story_credits INTO v_new_credits;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'שגיאה בטעינת הפרופיל');
    END IF;
  ELSIF v_coupon.coupon_type = 'discount' AND v_coupon.discount_percent IS NOT NULL THEN
    -- discount: no credit application, handled by caller
    NULL;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'סוג קופון לא תקין');
  END IF;

  -- Record redemption and increment usage atomically
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
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon_atomic(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) TO service_role;
