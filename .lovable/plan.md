

## Plan: Admin Dashboard Access Restrictions & Enhancements

### Changes

**1. Restrict access to `carmit1901@gmail.com` only**

**File: `src/pages/AdminDashboard.tsx`** (~line 183-198)
- After confirming `isAdmin`, add an email check: fetch the user's email and verify it equals `carmit1901@gmail.com`. If not, redirect to `/`.

**File: `src/pages/Settings.tsx`** (~line 46-49)
- Change the admin check to also verify the user's email is `carmit1901@gmail.com` before showing the dashboard link.

**File: `src/App.tsx`** — no route changes needed (the component itself handles the redirect).

**2. Add "Registration Date" column to users table**

Already exists — line 456 shows `formatDate(p.created_at)` under the "הצטרפות" header. This is already showing date+time. No change needed.

**3. Hide `carmit1901@gmail.com` from stats and table**

**File: `src/pages/AdminDashboard.tsx`**
- Find the admin user's ID from the email map and add it to `EXCLUDED_IDS`, or filter profiles/stories/purchases by email after data is fetched. Since the email is known at render time, filter out any profile where `email === 'carmit1901@gmail.com'` from `profiles`, `stories`, and `purchases` before display and stat calculations.

**4. Add "Registered This Week" stats card**

**File: `src/pages/AdminDashboard.tsx`** (~line 337-383)
- Add a 6th stat card calculating profiles where `created_at` is within the last 7 days.
- Update grid from `grid-cols-5` to `grid-cols-6` (or use `grid-cols-3` on mobile).

**5. Add 30-day new user registration line chart**

**File: `src/pages/AdminDashboard.tsx`**
- Import `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from `@/components/ui/chart` and `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid` from `recharts`.
- After the stats cards grid, add a chart card showing daily registration counts for the last 30 days.
- Aggregate `profiles` by `created_at` date, filling in zero for days with no registrations.

### Technical Details

- The admin email restriction uses `user.email` (available from the auth user object) rather than a DB query.
- The chart uses the existing `recharts` dependency and the project's `ChartContainer` wrapper.
- Stats cards grid changes to `grid-cols-3 md:grid-cols-6` to accommodate the new card.
- The admin's own data is filtered client-side after fetch (no DB changes needed).

