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
  SELECT * INTO v_coupon FROM public.coupons
  WHERE code = upper(trim(p_code)) AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'קוד קופון לא תקף');
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'הקופון פג תוקף');
  END IF;
  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.current_uses, 0) >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'הקופון מוצה');
  END IF;
  SELECT id INTO v_existing FROM public.coupon_redemptions
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
    -- Full-story coupon: same as a full Grow purchase — the credits are a "full" lot,
    -- so the story created with them gets its own print file (grantStoryAccess).
    IF COALESCE(v_coupon.grants_global_pdf, false) AND v_coupon.free_stories > 0 THEN
      INSERT INTO public.story_credit_lots (user_id, kind, remaining, source, order_id)
      VALUES (p_user_id, 'full', v_coupon.free_stories, 'coupon:' || v_coupon.code,
              'coupon_' || v_coupon.code || '_' || p_user_id::text)
      ON CONFLICT (order_id, kind) DO NOTHING;
    END IF;
  ELSIF v_coupon.coupon_type = 'discount' AND v_coupon.discount_percent IS NOT NULL THEN
    NULL;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'סוג קופון לא תקין');
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id) VALUES (v_coupon.id, p_user_id);
  UPDATE public.coupons SET current_uses = COALESCE(current_uses, 0) + 1 WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_type', v_coupon.coupon_type,
    'value', CASE WHEN v_coupon.coupon_type = 'extra_stories' THEN v_coupon.free_stories ELSE v_coupon.discount_percent END,
    'code', v_coupon.code
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) TO service_role;