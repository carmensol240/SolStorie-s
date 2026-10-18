# Bringing back the "Demo mode / Admin mode" switch

## What I found

- **The switch was never deleted.** It was added on 23/5/2026 and it is still in the code, on the **Settings** page (under the "לוח בקרה למנהל" button), not inside the control panel itself.
- **Why you don't see it:** it shows only to the one email `carmit1901+test@gmail.com`, not to admin users. If you now sign in with another account (for example your main admin account, or with the new Google / email-code sign-in), the switch stays hidden.
- **Weak points in how it works today:**
  - The choice is saved only in the browser, and only the story page reads it. The library, coloring pages, print file and taste lock ignore it.
  - Nothing on the server checks it, so for the server an admin is always fully open.
  - With a real admin account, demo mode would have no effect anyway, because "admin" always unlocks everything on the story page.
  - It is not linked to the admin role at all.

## What I'll build

1. **Who sees the switch:** only users with the admin role, checked on the server. The switch moves into the admin control panel and also stays in Settings. The special test email no longer gets it.
2. **Saved choice:** the mode is saved to the account on the server and stays until you change it, on every device.
3. **Clear on-screen label:** in demo mode, a small fixed badge "מצב דמו (אדמין)" appears on every page, with a quick button to switch back.
4. **Demo mode = a regular parent:** everywhere an admin normally gets extra access, demo mode turns it off: story lock, free taste, lock screen, prices, print file, coloring pages, page-1 retry limit and story editing. Access then follows only the new per-story rules. The admin pages themselves stay open so you can always switch back.
5. **Admin mode:** everything is open, as it is today.
6. **Regular users:** cannot turn on admin mode in any way. The server ignores the browser setting and anything in the web address, and the database refuses the setting for anyone who is not an admin.
7. **Nothing else changes.**

## Technical details

- New table `admin_view_mode (user_id uuid pk, mode text check in ('demo','admin'), updated_at)`. GRANT to authenticated/service_role; RLS lets a user select, insert or update only their own row, and only when `has_role(auth.uid(),'admin')`.
- New SQL function `public.is_effective_admin(uuid)`, security definer: returns true only when `has_role(admin)` AND the mode is not `'demo'` (with no row the default is `'admin'`).
- Edge functions that skip limits for admins (`generate-coloring-page`, `retry-illustration`) switch from `has_role` to `is_effective_admin`. Admin tools (dashboard, reviews, health, tense conversion, send-login-code) keep using `has_role`.
- Client: new hook `useAdminMode()` reads the role and mode from the server and returns `{ isAdmin, mode, effectiveAdmin, setMode }`. `StoryViewer`, `use-pdf-export`, `use-story-edit` and `Adventure` use `effectiveAdmin` in place of the raw admin check. `RequireAdmin`/`AdminDashboard` keep the raw role.
- The `tester_mode` localStorage path and the email-only `TESTER_EMAIL` switch are removed. The separate whitelisted tester account behaviour stays.
- Tests: a non-admin cannot write the mode; an admin in demo is not an effective admin; an admin in admin mode, or with no row, is one; a regular user with `tester_mode=admin` in localStorage stays locked.
- Manual check: sign in as admin, set demo, open a taste and an old story, confirm the lock screen and prices appear; switch to admin and confirm everything opens.
