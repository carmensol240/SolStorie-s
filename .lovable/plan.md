

## Plan: Fix 3 Admin Dashboard Issues

### Issue 1: Empty "Name" column — show email as fallback
**Lines 428, 877**: Change `p.display_name || "—"` to `p.display_name || p.email || "—"` so when display_name is null, the email is shown instead.

### Issue 2: Remove "רכישות" (Purchases) tab
- **Line 387**: Remove the `<TabsTrigger value="purchases">` element
- **Lines 445-481**: Remove the entire `<TabsContent value="purchases">` block
- **Line 385**: Change `grid-cols-7` to `grid-cols-6`
- Keep the purchases data fetch and stats cards (revenue, purchase count) since those are still useful summary metrics

### Issue 3: Coupons showing 0 records
The RLS policies look correct (admin has ALL access), and there are 15 coupons in the DB. The likely issue is that the fetch silently fails without error logging. I'll add `console.error` logging for coupons/redemptions fetch errors, and also add a fallback: if `couponsRes.error` exists, log it clearly. This will help diagnose if the issue persists. Additionally, the code currently only sets data `if (couponsRes.data)` — if there's a permission error, data would be null and the error is swallowed.

### Files changed
- `src/pages/AdminDashboard.tsx` — all 3 fixes in one file

