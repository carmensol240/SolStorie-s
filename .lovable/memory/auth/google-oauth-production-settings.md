---
name: Google OAuth Production Settings
description: Direct supabase.auth.signInWithOAuth with redirectTo pointing to https://soulstory.co.il/auth?returnTo=... ; returnTo also persisted via localStorage
type: feature
---
Google sign-in uses `supabase.auth.signInWithOAuth` directly (not lovable.auth.*).

`redirectTo` in `src/pages/Auth.tsx` (`handleGoogleSignIn`) MUST be:
`https://soulstory.co.il/auth?returnTo=${encodeURIComponent('/create?resume=true')}`

This sends users back to the app's `/auth` page after Google completes the OAuth round-trip via Supabase's backend callback. The Google Cloud Console Authorized redirect URI stays as `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` (Google → Supabase). The `redirectTo` option controls the final hop Supabase → app.

Pass post-login destination via `localStorage.setItem('returnTo', ...)` BEFORE calling signInWithOAuth (still done as a fallback). After OAuth, /auth and `OAuthReturnHandler` read `localStorage.getItem('returnTo')` / cookie `ss_return_to` and navigate accordingly.

GeneratingStep also persists `pending_story_formData` to localStorage so CreateStory's `?resume=true` flow restores the wizard.

Required backend allowlists:
- Supabase Redirect URLs: `https://soulstory.co.il/auth` (and wildcard variant for query string if needed)
- Supabase Site URL: `https://soulstory.co.il`
- Google Cloud Console Authorized redirect URIs: `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`

Iframe-escape (preview only): if `window.self !== window.top`, open `https://soulstory.co.il/auth` in a new top-level tab.
