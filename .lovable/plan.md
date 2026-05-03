# Fix: Old onboarding screen appears after Google Sign-In

## Root cause

The "old registration/login screen" the user is seeing is **`src/pages/Onboarding.tsx`** — the long welcome page with the two terms/privacy checkboxes.

Flow today:
1. User is in the create-story wizard, clicks **Google** in `AuthStep` (`src/components/wizard/AuthStep.tsx`).
2. Google completes → redirect lands on `/auth?returnTo=/create?resume=true`.
3. `src/pages/Auth.tsx` `checkTermsAcceptance` sees a logged-in user, queries `profiles.terms_accepted_at`, and because a brand-new Google user has no terms record yet, it redirects to **`/onboarding?returnTo=/create?resume=true`**.
4. That `/onboarding` page is the screen the user is calling "the old registration screen".

For the email/password path in `AuthStep`, terms are already required and persisted inline (the `auth-step-terms` checkbox + the `profiles.update({ terms_accepted_at })` call inside `handleSubmit`). The Google branch never persists that consent, so the global terms guard pushes the user to `/onboarding`.

## Fix (minimal, scoped to Google flow inside the wizard)

Only two files. No changes to `Onboarding.tsx`, no changes to the main `/auth` registration UI, no changes to story generation.

### 1. `src/components/wizard/AuthStep.tsx` — `handleGoogleSignIn`
- Require the existing `termsAccepted` checkbox before starting Google OAuth (show a toast otherwise — same message used in email signup).
- Before calling `supabase.auth.signInWithOAuth`, set two localStorage flags so the post-OAuth handler knows the user already consented in the wizard:
  - `localStorage.setItem('pending_wizard_terms_accept', '1')`
  - `localStorage.setItem('pending_wizard_marketing_consent', marketingConsent ? '1' : '0')`
- Also set the same flags inside the iframe-escape branch (before `window.open`) so the popped-out tab can read them — actually they live on a different origin in that case, so this only helps the in-place flow. The iframe path already opens production `/auth` and is a separate UX; we will leave it as-is and not add a new flag there.

### 2. `src/pages/Auth.tsx` — `checkTermsAcceptance` (the existing useEffect around line 275)
- Before the `profiles.terms_accepted_at` lookup, check for `pending_wizard_terms_accept === '1'`. If present:
  - `await supabase.from('profiles').update({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION, marketing_consent: pendingMarketing === '1' }).eq('id', user.id)`
  - Remove both pending flags.
- Then continue with the existing logic. Because terms are now persisted, the next branch will see `terms_accepted_at` set and route the user straight to `returnTo` (`/create?resume=true`), skipping `/onboarding`.

That's it — the user will land on `/create?resume=true`, `CreateStory.tsx` restores `pending_story_formData` from localStorage and resumes the wizard at the generating step (or, if there's no saved form data, at step 1 / the "tell us about your child" screen, which is the screen the user expects).

## Files to edit
- `src/components/wizard/AuthStep.tsx`
- `src/pages/Auth.tsx`

## Out of scope (will not change)
- `src/pages/Onboarding.tsx` — kept as-is for users who reach it via other entry points.
- Main `/auth` page registration form — untouched.
- `OAuthReturnHandler`, `RequireTerms`, `generate-story`, wizard steps — untouched.
