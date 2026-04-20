

## Fix: 404 after Google login click

### Root cause

`handleGoogleSignIn` in `src/pages/Auth.tsx` does this when running inside the Lovable preview iframe:

```ts
window.open(window.location.href, '_blank', 'noopener');
```

It opens **whatever URL the iframe currently has** in a new tab. Right now the user is on `/index` (per the current route info) — a path that does **not** exist in `App.tsx`'s router, so the new tab loads the `NotFound` 404 page. Same risk for any future route that happens to not match a `<Route>`.

The same flaw exists in `src/components/wizard/GeneratingStep.tsx` (added in the previous round).

The Google OAuth `redirect_uri` itself (`${window.location.origin}/auth?...`) is fine — `/auth` IS registered in `App.tsx`. The 404 is from the **escape-the-iframe** step, not from the OAuth callback.

### What I will change

Two surgical edits, no UI/design/route changes:

1. **`src/pages/Auth.tsx` — `handleGoogleSignIn`**
   Replace `window.open(window.location.href, ...)` with `window.open('${window.location.origin}/auth?returnTo=...', ...)`. The new tab is guaranteed to land on the existing `/auth` route, where the user can click Google again and complete OAuth top-level.

2. **`src/components/wizard/GeneratingStep.tsx` — `handleGoogleSignIn`**
   Same change: open `${window.location.origin}/auth?returnTo=/create?resume=true` (a valid route) instead of `window.location.href`.

### Files NOT touched

- No UI, design tokens, Tailwind, layout, or navigation
- No `App.tsx` routes (none added, none removed)
- No `use-auth.ts`, no Supabase client, no RLS, no edge functions
- No service worker / Vite PWA config (`/~oauth` already denylisted correctly)
- No new pages

### Verification after change

- Inside preview iframe on any route (including `/index` or any 404 path): click Google → new tab opens at `/auth` (real page) → click Google there → top-level OAuth completes → returns to `returnTo`.
- On published site (`wwwstorytime.lovable.app`): unchanged, OAuth runs inline.

