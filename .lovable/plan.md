## Problem

Package-mode purchases (79 / 199 / 249) fail for the whitelisted test user (`carmit1901+test@gmail.com`) with the toast "שגיאה בהוספת קרדיטים".

Root cause: the DB trigger `prevent_profile_privilege_escalation` blocks any non-service-role update to `story_credits`, `free_edits_remaining`, `free_edits_total`, `coloring_credits`. The test-user shortcut in `Upgrade.tsx` (`handleTestPurchase`) updates these fields directly from the client → trigger raises → purchase fails.

The recent `mode=single` changes did **not** touch the package UI flow — package cards, conditions, handlers, and `UserDetailsForm` are all intact. The failure is independent.

## Scope

Touch only the test-user code path. Do **not** modify:
- `mode=single` logic
- Real PayPal/CC flow (`handlePayPalSuccess`, `verifyPurchase`, `PayPalButton`)
- Package card rendering or conditions
- RLS policies or DB triggers

## Changes

### 1. `src/pages/Upgrade.tsx` — rewrite `handleTestPurchase` only

Replace the body of `handleTestPurchase` (lines ~95-132) to call the existing `verify-purchase` edge function with a synthetic test order ID and a special test marker, instead of writing to `profiles` from the client.

Approach: invoke `verify-purchase` with `{ orderId: 'test_<timestamp>', packageId: pkg.id, amount: 0, userId: user.id, testMode: true }`. After success, run the same post-purchase UX the real flow uses (`refetchCredits`, dispatch events, `setPurchasedCredits`, `setShowSuccess`, success toast).

No other functions in this file change.

### 2. `supabase/functions/verify-purchase/index.ts` — accept a test-mode bypass

Add a tightly-scoped branch:
- When `testMode === true`, skip the PayPal token + order verification.
- Still require `userId` and verify the user's email matches the hardcoded `carmit1901+test@gmail.com` (server-side check using service-role `auth.admin.getUserById`).
- Use `amount = 0` and prefix `package_name` with `test_` for the `purchases` insert.
- Then continue with the existing credit-update logic (already service-role, so the trigger allows it).

Reject `testMode` for any other user with 403.

No changes to the real PayPal verification branch.

### Technical details

- Test user constant already exists in `Upgrade.tsx` (`WHITELISTED_TEST_EMAIL`); mirror it in the edge function.
- `verify-purchase` already has the package config dictionary for `basic` / `popular` / `premium` / `educator_*`, so credit math is reused.
- Idempotency check (`existingPurchase`) keeps using `package_name = paypal_${orderId}`; the test path uses a different `orderId` prefix so no collision.
- Frontend toast on failure stays as-is; success toast text stays "🧪 קרדיטים נוספו בהצלחה (מצב בדיקה)".

## Out of scope (intentionally not changed)

- The `userDetailsValid` gate that hides the package PayPal button when the saved phone is invalid. This is pre-existing behavior; ping me if you also want it relaxed.
- `handleSinglePayPalSuccess` / `handleSinglePayPalError` and the single-story block.
- `prevent_profile_privilege_escalation` trigger (kept — it's a security boundary).
