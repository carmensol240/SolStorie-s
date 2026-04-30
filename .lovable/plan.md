## Goal
When unauthenticated users navigate to `/settings`, show a simple "please log in" message with a login button, instead of redirecting them to the `/auth` page (which currently shows the full registration/login form).

## Root cause
In `src/App.tsx`, the `/settings` route is wrapped in `<RequireTerms>`. For any unauthenticated visitor, `RequireTerms` immediately redirects to `/auth?returnTo=/settings`, which renders the full sign-up/sign-in form. That's the form the user is seeing.

## Scope
Only the `/settings` route behavior changes. `RequireTerms` itself stays untouched so that all other protected routes (`/create`, `/library`, `/profile`, etc.) keep their current behavior.

## Changes

### 1. `src/pages/Settings.tsx`
- Use `useAuth()` (already imported) to read `user` and `loading`.
- While `loading` is true: render the existing spinner pattern (matches the rest of the app).
- If `loading` is false and `user` is null: render a small centered card with:
  - Icon (Lucide `LogIn` or `User`)
  - Heading: "צריך להתחבר"
  - Short message: "כדי לגשת להגדרות יש להתחבר לחשבון שלך."
  - Primary button "התחברות" → `navigate('/auth?returnTo=/settings')`
  - Secondary text link "חזרה לדף הבית" → `navigate('/')`
  - Keep the same page chrome (gradient background, header, `<MobileNavigation />`) so it feels native to Settings.
- Return early before the existing settings menu renders. No other logic in the file changes (admin check, referral, PWA install, accessibility, dialogs all stay).

### 2. `src/App.tsx`
- Remove the `<RequireTerms>` wrapper from the `/settings` route only:
  ```diff
  - <Route path="/settings" element={<RequireTerms><Settings /></RequireTerms>} />
  + <Route path="/settings" element={<Settings />} />
  ```
- This lets `Settings.tsx` decide what to show for unauthenticated users instead of bouncing them to `/auth`.
- All other routes wrapped in `RequireTerms` remain unchanged.

## Out of scope
- `RequireTerms` component is not modified.
- `/auth` page content is not modified.
- Settings menu items, styling, and authenticated behavior are unchanged.
- No changes to terms-acceptance flow for logged-in users without accepted terms — note: removing `RequireTerms` from `/settings` means a logged-in user who hasn't accepted terms will no longer be auto-redirected to `/onboarding` from this page. The page is informational/legal-heavy (terms link, contact, about), so this is acceptable and arguably better.

## QA checklist
- Logged out → visit `/settings` → see "need to log in" card + login button (not the auth form).
- Click login button → goes to `/auth?returnTo=/settings`; after login, returns to `/settings` showing full settings.
- Logged in → `/settings` looks identical to before.
