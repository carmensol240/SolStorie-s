

## Bug Analysis

The onboarding loop is caused by a combination of issues in the navigation flow between `RequireTerms` and `Onboarding`:

1. **Silent update failure**: In `Onboarding.handleContinue`, the Supabase `.update().eq()` call returns success (`error: null`) even when **zero rows are matched** (e.g., due to a race condition where the profile hasn't been created yet). The code doesn't verify the update actually persisted.

2. **No `replace: true` on redirects**: Both `RequireTerms` (redirecting to `/onboarding`) and `Onboarding`'s guard effect (redirecting to `/adventure`) use `navigate()` without `{ replace: true }`, causing history stack pollution and making the loop worse.

3. **Loop mechanics**: `handleContinue` thinks it succeeded → navigates to `/adventure` → `RequireTerms` queries DB → `terms_accepted_at` is still null → redirects back to `/onboarding` → Onboarding guard checks terms → still null → shows the form again.

## Fix

### 1. `src/pages/Onboarding.tsx` — Verify update actually persisted

In `handleContinue`, after the update call, re-query the profile to confirm `terms_accepted_at` was saved. If not, use `upsert` as a fallback. Also add `{ replace: true }` to the guard navigation.

### 2. `src/components/RequireTerms.tsx` — Use `replace: true`

Change the `navigate` call to onboarding to use `{ replace: true }` so the history stack doesn't accumulate redirect entries.

### 3. Both files — Add select return on update

Use `.update(...).eq(...).select()` to get the updated row back, confirming the write succeeded. If the returned array is empty, fall back to an upsert to handle the edge case where the profile row doesn't exist yet.

