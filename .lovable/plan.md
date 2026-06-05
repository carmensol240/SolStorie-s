## Findings

- `purchases` table has 22 rows, **all** `status='test_completed'`, **all** `amount_ils=0`, **all** from the whitelisted test user `carmit1901+test@gmail.com` (`49cd7676-ab96-496b-9287-61a9d67d3e68`).
- Zero rows with `status='completed'` exist. No real (paid) purchase has been recorded in the DB.
- The dashboard "רכישות" card counts BOTH `completed` and `test_completed` (AdminDashboard.tsx:618), which is why it shows 22.

So the 22 are test-mode bypass purchases accumulated over ~2 months. The 2 "real credit card" purchases are either:
- (a) Also routed through `testMode` because they were made on the whitelisted test email (then they'd be among the 22, with amount=0 — losing the real amount), or
- (b) Real Grow webhook calls that never inserted a row (webhook failure, signature mismatch, or user-id resolution failure).

## Plan

### 1. Diagnose the 2 missing real purchases
- Pull `grow-webhook` edge function logs from the past 7 days and look for any incoming requests, signature failures, or errors.
- Check `error_logs` for `verify_purchase_error` or grow-webhook errors in the same window.
- Confirm which email/card the 2 real purchases were made under. If it was the whitelisted test email, the client likely sent `testMode: true` → that's why they recorded as `test_completed` with amount 0 (data loss).

### 2. Fix the admin counter so test purchases don't inflate "real" stats
In `src/pages/AdminDashboard.tsx`:
- "רכישות" StatCard (line 618): count only `status === 'completed'` (exclude `test_completed`).
- Optionally add a second small badge/card "בדיקות" showing `test_completed` count, so admin can still see test activity.
- `totalRevenue` (line 488) already correctly excludes `test_completed` — leave as-is.

### 3. Prevent real purchases from being silently swallowed by testMode
In `supabase/functions/verify-purchase/index.ts`:
- Currently any request from the whitelisted email with `testMode:true` becomes a free `test_completed` row. If the client accidentally passes `testMode:true` on a real PayPal/Grow flow, the real amount is lost.
- Add a guard: when `testMode === true`, require that `amount === 0` (or simply ignore amount and store 0). Real flows must NOT send `testMode:true`. Also log a warning if a non-zero amount arrives with testMode.
- Audit the client (Upgrade.tsx, paywall components) to confirm `testMode:true` is only sent from an explicit "Test purchase" debug button, never from the real checkout buttons.

### 4. (Optional) Clean up old test rows
Provide a one-off SQL the user can run via migration to delete the 22 old `test_completed` rows so the counter starts clean. Only if user wants.

## Deliverables
- Diagnostic report (from step 1) — which path the 2 real purchases took.
- Code change in `AdminDashboard.tsx` to count only real `completed`.
- Hardening of `verify-purchase` to prevent real revenue being recorded as test.
- Optional migration to wipe stale test rows.
