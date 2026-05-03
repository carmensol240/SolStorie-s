1. Harden `OAuthReturnHandler` so it does not depend only on auth events
   - Refactor it to use one shared `consumeReturnTo` routine that reads `returnTo` from the URL first, then the cookie, then `localStorage`.
   - Add an immediate session check on mount (`getSession`) so if the user already comes back authenticated, the handler still navigates to the saved destination.
   - Keep the existing `onAuthStateChange` listener for `SIGNED_IN` / restored-session cases, but route both paths through the same navigation logic.

2. Preserve the intended destination through the Google flow
   - In `src/pages/Auth.tsx`, make the Google sign-in flow consistently carry the current `returnTo` value instead of relying on a hardcoded destination.
   - If the flow pops out to a top-level tab, include the same `returnTo` in that `/auth` URL so the redirect target is not lost between origins.
   - Keep this scoped strictly to post-login redirect behavior only.

3. Validate the exact redirect behavior after login
   - Confirm these cases still behave correctly:
     - `/auth?returnTo=/create?resume=true` returns the user to story creation.
     - A plain `/auth` Google login falls back to the existing default destination.
     - Existing cleanup of `returnTo` / `ss_return_to` still happens after navigation so stale redirects are not reused.

Technical details
- Files likely involved:
  - `src/components/auth/OAuthReturnHandler.tsx`
  - `src/pages/Auth.tsx` (only for preserving the existing `returnTo` across Google sign-in)
- No other auth, onboarding, signup, or story-generation logic will be changed.
- The goal is only to make successful Google OAuth continue to the already-requested route instead of leaving the user on `/auth`. 