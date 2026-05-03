# Hide Google Sign-In button

Flip the existing `GOOGLE_SIGNIN_ENABLED` feature flag to `false` in the two files that render the Google button, and remove the now-unused surrounding UI (the button itself and the "או" divider) so users don't see a dead/empty space.

## Changes

**`src/pages/Auth.tsx`**
- Set `GOOGLE_SIGNIN_ENABLED = false` (line 24).
- Remove the Google button block on the login tab (around lines 1356–1375) and its preceding "או" separator.
- Remove the Google button block on the signup tab (around lines 1511–1530) and its preceding "או" separator.

**`src/components/wizard/AuthStep.tsx`** (the wizard auth step shown at GeneratingStep)
- Set `GOOGLE_SIGNIN_ENABLED = false` (line 14).
- Remove the Google `<button>` (lines ~174–188) and the "או" divider directly below it.

## Out of scope (intentionally left alone)
- `handleGoogleSignIn` functions, OAuth helpers, `OAuthReturnHandler`, `use-auth.signInWithGoogle`, and `pending_*` localStorage flags stay in place — dormant — so re-enabling later is a one-line flip.
- No other auth, navigation, or storage behavior changes.
