# Fix: After Google login, app stays on splash instead of resuming

## Root cause

After Google OAuth completes, Supabase redirects the browser back to the site root (`/`). React Router renders `Adventure` (the splash/animation screen) for `/`. On that fresh page load:

1. `useAuth` calls `supabase.auth.getSession()` and finds the restored session.
2. `supabase.auth.onAuthStateChange` fires with event **`INITIAL_SESSION`** (because the session was restored from storage on page load), **not `SIGNED_IN`**.
3. `OAuthReturnHandler` only acts on the `SIGNED_IN` event, so it never reads `ss_return_to` / `localStorage.returnTo` and never navigates to `/create?resume=true`.
4. `Adventure` is the catch-all landing route for everyone (logged in or not), so the user is left looking at the splash video.

The `Auth.tsx` page does have `getReturnTo()` logic that would route correctly — but it only runs when the user lands on `/auth`. After OAuth callback the user lands on `/`, so that code never executes.

## Fix (single file: `src/components/auth/OAuthReturnHandler.tsx`)

Make the handler consume `returnTo` on **both** `SIGNED_IN` and `INITIAL_SESSION` events (only when a session is actually present), so it works after the post-OAuth page reload:

- Change the event guard from `if (event !== "SIGNED_IN") return;` to:
  - Allow `SIGNED_IN` always.
  - Allow `INITIAL_SESSION` only when `session` is non-null (so logged-out visitors to `/` are not affected).
- Keep all existing behavior:
  - Read cookie `ss_return_to` first, then `localStorage.returnTo`.
  - Always clear both after reading.
  - Open-redirect protection (must start with `/`, not `//`).
  - Skip if already on the target path.

This is the minimal change. It does not touch `Adventure`, `Auth.tsx`, the iframe-escape branch in `AuthStep.tsx`, or any auth/storage logic.

## Why not change `Adventure` to redirect logged-in users?

The product intentionally shows the splash + "יוצאים להרפתקה" CTA to logged-in users on `/` and `/adventure` (it's the main home screen, not just an unauthenticated splash). Redirecting all logged-in visitors away from `/` would break the home experience. The fix should only fire when a `returnTo` was explicitly stored before an OAuth redirect — which is exactly what `OAuthReturnHandler` already gates on.

## Verification after implementation

1. From `/create` step 3, click "המשיכו עם Google".
2. Complete Google consent.
3. Browser returns to site root; expected: immediate replace-navigation to `/create?resume=true`, wizard resumes at topic selection.
4. Cookie `ss_return_to` and `localStorage.returnTo` are cleared.
5. Logged-in users visiting `/` directly (no `returnTo` set) still see the Adventure splash — unchanged.
6. Logged-out users visiting `/` are unaffected (no session, handler does nothing).
