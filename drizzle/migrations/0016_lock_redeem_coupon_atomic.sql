REVOKE EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) TO service_role;