# Bringing back the "Demo mode / Admin mode" switch

## What I found

- **The switch was never deleted.** It was added on 23/5/2026 and it is still in the code, on the **Settings** page (under the "לוח בקרה למנהל" button), not inside the control panel itself.
- **Why you don't see it:** it shows only to the one email `carmit1901+test@gmail.com`, not to admin users. If you now sign in with another account, the switch stays hidden.
- **Weak points in how it works today:** the choice is saved only in the browser and only the story page reads it. The server never checks it, and it is not linked to the admin role.
- **Credits today:** story creation and taste unlock have no admin shortcut. Admins already pay a credit like any parent.

## What I'll build

1. **Who sees the switch:** only users with the admin role, checked on the server. It goes into the admin control panel and also stays in Settings.
2. **Saved choice:** the mode is saved to the account on the server and stays until you change it, on every device.
3. **Clear on-screen label:** in demo mode, a fixed badge "מצב דמו (אדמין)" shows on every page, with a quick button to switch back.
4. **Demo mode = a regular parent:** story lock, free taste, lock screen, prices, print file, coloring pages, page-1 retry limit and story editing follow only the per-story rules. Creating a story and unlocking a taste charge a credit, exactly like a parent. The admin pages stay open so you can switch back.
5. **Admin mode:** everything is open, as it is today. Credits are charged as today, since there is no admin skip.
6. **Regular users:** cannot turn on admin mode in any way. The server ignores the browser and the web address, and the database refuses the setting for non-admins.
7. **Nothing else changes.**

## Technical details

- New table `admin_view_mode (user_id uuid pk, mode text check in ('demo','admin'), updated_at)`, with GRANT and RLS: own row only, and only when `has_role(auth.uid(),'admin')`.
- New security-definer function `public.is_effective_admin(uuid)`: true only when the user is an admin and the mode is not `'demo'`. With no saved row the default is admin mode.
- `generate-coloring-page` and `retry-illustration` use `is_effective_admin` in place of `has_role`. `generate-story` and `unlock-taste-story` have no admin credit skip; any future skip there must use `is_effective_admin`. This rule goes into AGENTS.md.
- Client hook `useAdminMode()` returns `{ isAdmin, mode, effectiveAdmin, setMode }`. `StoryViewer`, `use-pdf-export`, `use-story-edit` and `Adventure` use `effectiveAdmin`. The admin pages keep the raw role.
- The `tester_mode` localStorage path and the email-only switch are removed.
- Tests: a non-admin cannot write the mode; an admin in demo is not an effective admin; an admin in admin mode, or with no row, is one; a regular user with `tester_mode=admin` in the browser stays locked.
- Manual check: sign in as admin and set demo. Open a taste and an old story and confirm the lock and prices appear. Then switch to admin and confirm everything opens.
