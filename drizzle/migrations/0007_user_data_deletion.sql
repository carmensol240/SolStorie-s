CREATE OR REPLACE FUNCTION public.delete_story_rows(p_story_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_story_ids IS NULL OR array_length(p_story_ids,1) IS NULL THEN RETURN; END IF;
  DELETE FROM public.story_coloring_pages WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.story_unlocks WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.pdf_entitlements WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.pdf_downloads WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.illustration_logs WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.cover_logs WHERE story_id = ANY(p_story_ids);
  UPDATE public.free_taste_claims SET story_id = NULL WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.analytics_events WHERE story_id = ANY(p_story_ids);
  DELETE FROM public.stories WHERE id = ANY(p_story_ids);
END $$;

CREATE OR REPLACE FUNCTION public.delete_user_rows(p_user uuid, p_email_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_ids FROM public.stories WHERE user_id = p_user;
  PERFORM public.delete_story_rows(v_ids);
  DELETE FROM public.children WHERE user_id = p_user;
  DELETE FROM public.digital_books WHERE user_id = p_user;
  DELETE FROM public.parent_notes WHERE user_id = p_user;
  DELETE FROM public.topic_wishlist WHERE user_id = p_user;
  DELETE FROM public.user_feedback WHERE user_id = p_user;
  DELETE FROM public.user_story_stats WHERE user_id = p_user;
  DELETE FROM public.story_coloring_pages WHERE user_id = p_user;
  DELETE FROM public.story_coloring_allowances WHERE user_id = p_user;
  DELETE FROM public.story_credit_lots WHERE user_id = p_user;
  DELETE FROM public.story_unlocks WHERE user_id = p_user;
  DELETE FROM public.pdf_entitlements WHERE user_id = p_user;
  DELETE FROM public.pdf_downloads WHERE user_id = p_user;
  DELETE FROM public.pending_gifts WHERE user_id = p_user;
  DELETE FROM public.coupon_redemptions WHERE user_id = p_user;
  DELETE FROM public.analytics_events WHERE user_id = p_user;
  DELETE FROM public.error_logs WHERE user_id = p_user;
  DELETE FROM public.admin_alerts WHERE user_id = p_user;
  UPDATE public.admin_alerts SET resolved_by = NULL WHERE resolved_by = p_user;
  DELETE FROM public.admin_view_mode WHERE user_id = p_user;
  DELETE FROM public.referrals WHERE referrer_id = p_user OR referred_id = p_user;
  DELETE FROM public.free_taste_claims WHERE user_id = p_user;
  IF p_email_hash IS NOT NULL THEN
    INSERT INTO public.free_taste_claims (user_id, normalized_email) VALUES (gen_random_uuid(), p_email_hash);
  END IF;
  -- Accounting retention: keep the purchase rows but detach them from the person.
  UPDATE public.purchases SET user_id = gen_random_uuid() WHERE user_id = p_user;
  DELETE FROM public.user_roles WHERE user_id = p_user;
  DELETE FROM public.profiles WHERE id = p_user;
END $$;

REVOKE ALL ON FUNCTION public.delete_story_rows(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user_rows(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_story_rows(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_rows(uuid, text) TO service_role;
COMMENT ON TABLE public.purchases IS 'Kept for accounting (7y). On account deletion user_id is replaced by a random UUID; no name/email stored here.';