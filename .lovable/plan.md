

## Re-enable Sign in with Google

### Root cause
Two files set a kill-switch constant `const GOOGLE_SIGNIN_ENABLED = false;` which:
- Disables the Google buttons (`disabled={... || !GOOGLE_SIGNIN_ENABLED}`)
- Greys them out (`disabled:opacity-50 disabled:grayscale`)
- Adds a "בקרוב" (coming soon) badge next to the label
- Causes `handleGoogleSignIn` to early-return without invoking OAuth

### Changes (two files only)

**1. `src/pages/Auth.tsx`**
- Line 24: change `const GOOGLE_SIGNIN_ENABLED = false;` → `const GOOGLE_SIGNIN_ENABLED = true;`

**2. `src/components/wizard/GeneratingStep.tsx`**
- Line 23: change `const GOOGLE_SIGNIN_ENABLED = false;` → `const GOOGLE_SIGNIN_ENABLED = true;`

That single one-line flip in each file:
- Re-enables the login Google button (Auth.tsx line 1292)
- Re-enables the signup Google button (Auth.tsx line 1447)
- Re-enables the wizard Google button (GeneratingStep.tsx line 846)
- Removes the "בקרוב" badges automatically (they're rendered via `{!GOOGLE_SIGNIN_ENABLED && ...}`)
- Allows `handleGoogleSignIn` to proceed past the early return on lines 365 / 609

### What will NOT change
- No layout, color, button text, or icon changes.
- `handleGoogleSignIn` body untouched — it already uses the production-correct `supabase.auth.signInWithOAuth` with hardcoded `redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'` (per `mem://auth/google-oauth-production-settings`).
- Iframe-escape behavior preserved (opens `https://soulstory.co.il/auth` in new tab when in preview).
- `returnTo` localStorage persistence preserved.
- No backend, RLS, route, or other component changes.

### Verification after flip
- Login tab: Google button is colored, clickable, no "בקרוב" badge.
- Signup tab: Google button enables once terms checkbox is ticked.
- GeneratingStep wizard: Google button enabled.
- Click → redirects to Google consent → returns to `/auth` → routes to `/onboarding` or `/adventure` based on terms acceptance.

### How to revert
Flip both constants back to `false`.

