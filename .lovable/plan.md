## Why users show "—" in the admin users table

I checked the database and the dashboard code:

- **125 profiles, but 105 have `display_name = NULL`.** The `handle_new_user` trigger only stores `display_name` when the signup metadata contains one. Google OAuth signups and most email signups don't supply it, so the column stays empty.
- **`profiles.email` is NULL for all 125 profiles.** That column exists but is never populated on signup.
- Emails are pulled at runtime via the `get_admin_user_emails` RPC and merged into a map. If that RPC ever returns null/error (network blip, transient auth issue), the email column shows "—" for *everyone* because there's no fallback.
- The dashboard's name cell renders `p.display_name || "—"` — it ignores the `displayName` fallback (`email.split("@")[0]`) that's already computed two lines above for the email button.

Net effect: even when everything works, 105 rows show "—" for name; if the RPC hiccups, the whole email column also shows "—".

## Fix

Two surgical changes, both in `src/pages/AdminDashboard.tsx`, plus one backfill so the email column is never empty again.

### 1. Frontend fallbacks (`src/pages/AdminDashboard.tsx`)

- **Name cell** (line 716): use the already-computed `displayName` variable instead of `p.display_name || "—"`, so users with no display name show their email local-part.
- **Email cell** (line 717): fall back to `p.email` (from the profiles row) when the RPC map doesn't have an entry: `emailMap.get(p.id) || p.email || "—"`. This protects against an RPC failure.
- Add the `email` column to the profiles SELECT on line 364 so the fallback has data to use.
- Log a warning when `emailsRes.error` is set, so future RPC failures are visible in the console instead of silently blanking the column.
- Apply the same fallback wherever a profile is looked up for display (stories tab line 841-842, purchases tab line 902-903, errors tab line 983-984).

### 2. Backfill + auto-populate `profiles.email` (new migration)

So the fallback always has real data:

- Backfill: `UPDATE profiles SET email = au.email FROM auth.users au WHERE profiles.id = au.id AND profiles.email IS NULL;`
- Update `handle_new_user()` to also insert `new.email` into `profiles.email` for future signups.

### Out of scope

No changes to RLS, the admin RPC, purchase/stats logic, or any other tab's data fetching. Display-only fixes plus an email backfill.
