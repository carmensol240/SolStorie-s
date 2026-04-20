

## Temporarily disable Google sign-in button

### Goal
Visually disable the Google sign-in button across the app and add a small "בקרוב" label next to it. No code is removed — only disabled state and a label are added, so it can be re-enabled later by reverting these small changes.

### Where the button appears
Two active locations:
1. `src/pages/Auth.tsx` — Google sign-in button on the login/signup screen
2. `src/components/wizard/GeneratingStep.tsx` — Google sign-in button shown to anonymous users at the end of the story wizard

(`src/hooks/use-auth.ts` exposes the `signInWithGoogle` helper — left untouched so the underlying logic stays intact.)

### Changes per file

**`src/pages/Auth.tsx`**
- Add `disabled` attribute to the Google button.
- Add Tailwind classes for grayed-out look: `opacity-50 cursor-not-allowed grayscale hover:opacity-50`.
- Remove the `onClick` behavior by guarding the handler (early return if disabled flag is true) — handler code stays in place, just gated by a constant `const GOOGLE_SIGNIN_ENABLED = false;` at the top of the component.
- Add a small `<span className="text-xs text-muted-foreground mr-2">בקרוב</span>` next to or inside the button (RTL-aware placement).

**`src/components/wizard/GeneratingStep.tsx`**
- Same treatment: add the same `GOOGLE_SIGNIN_ENABLED = false` constant, `disabled` prop, grayed-out classes, and `בקרוב` label next to the button.

### What will NOT change
- No code deletion — `signInWithGoogle`, `handleGoogleSignIn`, and all related logic stay exactly as they are.
- No changes to `use-auth.ts`, Supabase config, OAuth redirect URLs, or routing.
- No changes to email/password sign-in — only the Google button is disabled.
- No layout, copy, or styling changes elsewhere on the page.

### How to re-enable later
Flip `GOOGLE_SIGNIN_ENABLED` from `false` to `true` in both files and remove the `בקרוב` label + grayed-out classes.

### Files to update
- `src/pages/Auth.tsx`
- `src/components/wizard/GeneratingStep.tsx`

