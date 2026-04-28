

## Urgent fix: skip /onboarding for both parents AND educators

### Problem

Both parents and educators are seeing a duplicate terms-acceptance screen (`/onboarding`) after signup, even though they already ticked the terms checkbox in `Auth.tsx`. The educator fix from the previous turn only persisted `terms_accepted_at` for educators — parents still hit `/onboarding`.

### Root cause

`Auth.tsx → handleEmailSignUp` and `handleGoogleSignIn` only persist `terms_accepted_at` when `userRole === "educator"`. For parents, `terms_accepted_at` stays null, so the `checkTermsAcceptance` effect redirects them to `/onboarding`.

### Fix — single file: `src/pages/Auth.tsx`

Remove the `userRole === "educator"` gate so the terms acceptance is persisted for **all signups** (parents + educators) when `signupTermsAccepted` is true.

**Edit 1 — `handleEmailSignUp`:**
Change the existing block:
```ts
if (userRole === "educator" && data?.user?.id && signupTermsAccepted) { ... }
```
to:
```ts
if (data?.user?.id && signupTermsAccepted) {
  await supabase
    .from("profiles")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION,
    })
    .eq("id", data.user.id);
}
```

**Edit 2 — `handleGoogleSignIn`:**
Change:
```ts
if (userRole === "educator" && signupTermsAccepted) {
  localStorage.setItem('pending_educator_terms_accept', '1');
}
```
to (keep the same flag key for backward compat, but set it for everyone who ticked the box):
```ts
if (signupTermsAccepted) {
  localStorage.setItem('pending_educator_terms_accept', '1');
}
```

**Edit 3 — `checkTermsAcceptance` useEffect:**
The existing code already reads `pending_educator_terms_accept` and persists `terms_accepted_at` regardless of role. No change needed — it will now run for parents too.

### Result

- Parent signup (email + Google) → terms persisted → `checkTermsAcceptance` sees terms accepted → redirect straight to `/adventure` (or RequireTerms `returnTo` deep-link). No `/onboarding` screen. ✅
- Educator signup → unchanged behavior, still skips `/onboarding`. ✅
- Existing user who somehow lands on `/onboarding` without `terms_accepted_at` (legacy accounts, edge cases) → still sees the screen as a fallback. ✅

### What stays the same

- `Onboarding.tsx` — untouched (kept as fallback for legacy accounts).
- `RequireTerms.tsx`, `returnTo` deep-link logic, toasts, welcome emails, role-based credits, referral codes — all untouched.
- The signup form's terms checkbox + links — untouched.

### Memory update

Update `mem://auth/registration-process-updated`: `terms_accepted_at` is now written immediately on signup for **all roles** (parent + educator) when the user ticks the terms box in `Auth.tsx`. `/onboarding` is bypassed for all new signups. The screen remains as a fallback for legacy accounts only.

### How to revert

Restore the `userRole === "educator"` condition in both the `handleEmailSignUp` block and the `handleGoogleSignIn` localStorage flag.

