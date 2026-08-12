DO $$
DECLARE
  uid uuid := 'a3f3710e-7afa-44d8-a934-62d5b3227a0d';
BEGIN
  INSERT INTO public.purchases (user_id, package_name, credits_purchased, amount_ils, status) VALUES
    (uid, 'test_manual-grant-1_popular', 2, 0, 'test_completed'),
    (uid, 'test_manual-grant-2_popular', 1, 0, 'test_completed'),
    (uid, 'test_manual-grant-3_popular', 1, 0, 'test_completed');

  ALTER TABLE public.profiles DISABLE TRIGGER prevent_profile_privilege_escalation_trg;

  UPDATE public.profiles SET
    story_credits = COALESCE(story_credits,0) + 4,
    free_edits_remaining = COALESCE(free_edits_remaining,0) + 4,
    free_edits_total = COALESCE(free_edits_total,0) + 4,
    coloring_credits = COALESCE(coloring_credits,0) + 15,
    first_purchase_bonus_given = true
  WHERE id = uid;

  ALTER TABLE public.profiles ENABLE TRIGGER prevent_profile_privilege_escalation_trg;

  INSERT INTO public.pdf_entitlements (user_id, story_id, source, amount_paid)
  VALUES (uid, NULL, 'test', 0)
  ON CONFLICT (user_id, story_id) DO NOTHING;
END $$;