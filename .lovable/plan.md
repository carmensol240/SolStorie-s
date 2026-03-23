

## Plan: Add "Coupons & Partners" Section to Admin Dashboard

### What changes

Add a new tab "קופונים ושותפים" to the admin dashboard that shows coupon usage analytics: summary cards at top, and an expandable table per coupon code showing registered users, their activity status, and story counts.

### Data strategy

All data is fetched client-side using existing tables accessible to admins:
- `coupons` — all coupon codes
- `coupon_redemptions` — who redeemed which coupon, with `redeemed_at`
- `profiles` — user display names, `created_at`
- `stories` — count per user
- `get_admin_user_emails` RPC — emails (already fetched)

No new tables or migrations needed. The "active in last 30 days" check will use `profiles.updated_at` (which is updated via trigger on any profile change) as an approximation, or we can check if the user has stories created in the last 30 days.

### Changes (single file: `src/pages/AdminDashboard.tsx`)

**1. New state variables**
- `couponRedemptions` — fetched from `coupon_redemptions` joined with coupon code
- `coupons` — fetched from `coupons` table

**2. New fetch in the `isAdmin` data loading effect**
- Fetch all coupons: `supabase.from("coupons").select("*")`
- Fetch all redemptions: `supabase.from("coupon_redemptions").select("*")`
- Cross-reference with already-fetched `profiles` (with emails) and `stories` for per-user story counts

**3. New tab in TabsList** — grid changes from `grid-cols-6` to `grid-cols-7`, add "קופונים ושותפים" trigger

**4. Summary cards at top of tab content**
- Total users via coupons (unique user_ids in redemptions)
- Most popular code (highest redemption count)
- Activity rate (% of coupon users with stories in last 30 days)

**5. Expandable table per coupon code**
- Each row: coupon code, redemption count, expandable detail
- Detail rows: user name, email, registration date, active badge (stories in last 30 days), story count
- Use a `useState` to track which coupon row is expanded

### What stays the same
- All existing tabs, data fetching, and UI unchanged
- No database changes needed

