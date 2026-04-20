

## Fix: educator (and parent) post-onboarding redirect lands on Settings instead of Home

### Root cause

In the signup → about-screen flow:

1. User clicks Signup (often arrives at `/auth` from the bottom nav's Settings tab, or from `RequireTerms` blocking `/settings`).
2. `Auth.tsx` reads `returnTo` from query string OR `localStorage.getItem('returnTo')` — which can be `/settings` from a previous redirect.
3. After successful signup, `Auth.tsx` redirects to `/onboarding?returnTo=/settings` (the "about" screen with terms checkboxes).
4. In `Onboarding.tsx`, after the user ticks both checkboxes and presses **המשך** ("continue"), `handleContinue` calls `navigate(getReturnTo())` which reads the same stale `returnTo=/settings` from the query string.
5. Result: the educator lands on Settings instead of Home.

This affects educators more visibly because their signup path often passes through Settings/Toolkit gates, but the same bug exists for parents in the same scenario.

### Fix

**Single file change: `src/pages/Onboarding.tsx`**

Change `handleContinue`'s post-success navigation so that the **first time** a user accepts terms (the about-screen acceptance), they are always routed to the home/main screen — `/adventure` — regardless of any stale `returnTo` left in the URL or localStorage.

Specifically:

- Replace `navigate(getReturnTo(), { replace: true });` (current behavior — uses `returnTo`) with `navigate("/adventure", { replace: true });`.
- Also clear any stale `localStorage.getItem('returnTo')` value so it doesn't leak into later navigations.
- The unused `getReturnTo()` helper and the `useSearchParams` import can be removed.

Behavior after fix:
- Parent signup → about/onboarding screen → tick terms → press המשך → **`/adventure`** (home). ✅
- Educator signup → about/onboarding screen → tick terms → press המשך → **`/adventure`** (home). ✅
- The educator-specific welcome banner on `/adventure` (in `LoggedInHome.tsx`) continues to work because it reads `user_role` from the profile.

### What will NOT change

- `Auth.tsx` redirect logic, signup handler, terms-acceptance toast, educator-specific welcome toast — all untouched.
- `RequireTerms.tsx` (which legitimately uses `returnTo` to bring users back to a protected page they tried to visit) — untouched. Its `returnTo` flow is separate: when an already-signed-up user without accepted terms tries to visit, e.g., `/library`, RequireTerms sends them to `/onboarding?returnTo=/library`, and after accepting they correctly land on `/library`.

  → **However**, applying the fix above would also override RequireTerms's intended `returnTo`. To avoid breaking that flow, the fix uses this rule instead:

  > If `returnTo` is missing **or** points to `/settings`, `/`, `/adventure`, or `/auth`, force `/adventure`. Otherwise honor `returnTo` (preserves the RequireTerms deep-link experience).

- All onboarding content (text, emojis, checkboxes, buttons, layout, colors, fonts) — untouched.
- About page (`/about`), Settings, Toolkit, Educator package logic — untouched.

### Memory

Update `mem://navigation/entry-and-smart-flow` to record:
> After accepting terms on the onboarding/about screen, the user is always routed to `/adventure` (home) — never to `/settings` — even if a stale `returnTo` query param points elsewhere. Exception: deep-link returnTo from RequireTerms (e.g., `/library`, `/create`, `/upgrade`) is still honored.

### How to revert

Restore the original `navigate(getReturnTo(), { replace: true });` call in `Onboarding.tsx` and re-add the `getReturnTo` helper and `useSearchParams` import.

