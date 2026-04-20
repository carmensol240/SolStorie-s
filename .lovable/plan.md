

## Skip duplicate terms screen for educators (parent flow untouched)

### Root cause

In `src/pages/Auth.tsx → handleEmailSignUp` (and `handleGoogleSignIn`), the user already ticks the **תנאי שימוש + מדיניות פרטיות** checkbox (`signupTermsAccepted`) before submitting. But the handler never writes `terms_accepted_at` to the DB — the comment on line 431 ("terms already accepted") is misleading.

After signup, the `checkTermsAcceptance` useEffect runs, sees `terms_accepted_at` is null, and redirects to `/onboarding`, which renders the **second** pair of checkboxes (lines 240–276 of `Onboarding.tsx`).

### Fix — single targeted change in `src/pages/Auth.tsx`

Persist `terms_accepted_at` to the `profiles` row **only for educators** immediately after a successful signup, so the redirect logic skips `/onboarding` and lands them on `/adventure`.

**Edit 1 — `handleEmailSignUp` (around line 430–447):**
After `const { error, data } = await signUpWithEmail(...)` succeeds and before the toast, add (only for educators):

```ts
if (userRole === "educator" && data?.user?.id && signupTermsAccepted) {
  await supabase
    .from("profiles")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    })
    .eq("id", data.user.id);
}
```

The existing `checkTermsAcceptance` useEffect will then detect terms are accepted and redirect the educator straight to `/adventure` (or to the deep-link `returnTo` if any).

**Edit 2 — `handleGoogleSignIn` (educator path):**
Google sign-in is a redirect flow, so we cannot write to `profiles` before the redirect. Instead, store a flag in `localStorage` before calling `signInWithOAuth`:

```ts
if (userRole === "educator" && signupTermsAccepted) {
  localStorage.setItem('pending_educator_terms_accept', '1');
}
```

Then in the existing `checkTermsAcceptance` useEffect (lines 268–299), before the DB read, if the flag is present and the user just signed in, write `terms_accepted_at` once and clear the flag — then continue with the existing redirect logic which will now route to `/adventure`.

### What stays the same

- **Parent flow** — `userRole === "parent"` is untouched. Parents still go through `/onboarding` exactly as today (per existing product decision).
- `Onboarding.tsx` is **not modified**. Its checkboxes still render for any user who lands there without `terms_accepted_at` (parents, legacy users, edge cases).
- `RequireTerms.tsx`, deep-link `returnTo` handling, terms version, toasts — all untouched.
- The educator-specific welcome toast on signup (lines 436–440) still fires.

### Why this approach (vs. editing Onboarding.tsx)

- Educators bypass the duplicate screen entirely — cleaner UX (no flash of `/onboarding` then redirect).
- `Onboarding.tsx` keeps a single rendering path — no role-based conditional rendering to maintain.
- Parents are 100% unaffected because all changes are gated on `userRole === "educator"`.

### Memory update

Update `mem://auth/registration-process-updated`: educators have `terms_accepted_at` written immediately on signup (since they already consented in the Auth form), so `/onboarding` is skipped for them. Parents continue through `/onboarding` as before.

### How to revert

Remove the educator-only `profiles.update` block in `handleEmailSignUp` and the `pending_educator_terms_accept` localStorage flag handling in `handleGoogleSignIn` + `checkTermsAcceptance`.

