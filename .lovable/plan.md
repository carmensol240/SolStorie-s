

## Fix: Use exact redirect URL `https://soulstory.co.il/auth`

### What changes

Currently the code passes `redirectTo: https://soulstory.co.il/auth?returnTo=...` and `https://soulstory.co.il/create?resume=true`. With query params, the URL no longer matches the exact `https://soulstory.co.il/auth` you whitelisted in Supabase + Google Console — Supabase's redirect-allowlist matches the **base URL** but Google's OAuth redirect-URI check is **exact**, so any deviation can trigger `redirect_uri_mismatch`.

I'll make both Google sign-in handlers redirect to **exactly** `https://soulstory.co.il/auth` and preserve the `returnTo` / resume hint in `localStorage` instead of the URL.

### Files touched (2 — handler bodies only, no UI)

#### 1. `src/pages/Auth.tsx` — `handleGoogleSignIn` (lines 363-394)
- Save `returnTo` to `localStorage` (already done on line 366 — keep).
- Change `redirectTo` from `` `https://soulstory.co.il/auth?returnTo=${...}` `` → `'https://soulstory.co.il/auth'` (no query string).
- Iframe-escape new tab still opens `/auth` on current origin (unchanged — that's preview-only and unrelated to the production redirect URI).

#### 2. `src/components/wizard/GeneratingStep.tsx` — `handleGoogleSignIn` (lines 607-629)
- Save `'pending_story_formData'` (already done — keep) and additionally set `localStorage.setItem('returnTo', '/create?resume=true')` so `/auth` knows where to send the user after sign-in.
- Change `redirectTo` from `` `https://soulstory.co.il/create?resume=true` `` → `'https://soulstory.co.il/auth'` (exact match).
- After OAuth completes and `/auth` loads, the existing `useEffect` that watches `user` will navigate to `localStorage.getItem('returnTo')` → `/create?resume=true`, where `CreateStory.tsx`'s existing resume logic restores `pending_story_formData` and continues generation.

### Returnto handling on `/auth` (already exists, no change)

`src/pages/Auth.tsx` already reads `returnTo` from `localStorage` as a fallback (line 365). After Google completes, `useAuth`'s `onAuthStateChange` fires, `user` becomes truthy, and the existing post-auth redirect picks up `localStorage.getItem('returnTo')`.

### Backend config (you said this is already done — just confirming what's required)
- Supabase → Auth → Redirect URLs allowlist must include: `https://soulstory.co.il/auth`
- Google Cloud Console → Authorized redirect URIs must include: `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` (Google never redirects to your domain — only to Supabase)
- Supabase → Auth → Site URL: `https://soulstory.co.il`

### What is NOT changing
- No UI, no Pixar styling, no buttons, no layout, no tablet optimization
- No new routes, no `App.tsx` changes
- No `use-auth.ts`, no Supabase client, no RLS, no edge functions
- Iframe-escape logic stays (preview-only workaround)

### Memory update
Update `mem://auth/google-oauth-production-settings` to reflect the exact `redirectTo: 'https://soulstory.co.il/auth'` (no query params) and the `localStorage`-based returnTo fallback.

