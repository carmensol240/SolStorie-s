---
name: Google OAuth Production Settings
description: Direct supabase.auth.signInWithOAuth with exact redirectTo 'https://soulstory.co.il/auth' (no query params); returnTo persisted via localStorage
type: feature
---
Google sign-in uses `supabase.auth.signInWithOAuth` directly (not lovable.auth.*).

`redirectTo` MUST be EXACTLY `'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'` — the Supabase backend callback URL. No query strings. Forced configuration per user requirement to match Google Console exactly.

Pass post-login destination via `localStorage.setItem('returnTo', ...)` BEFORE calling signInWithOAuth. After OAuth, /auth reads `localStorage.getItem('returnTo')` and navigates accordingly.

GeneratingStep also persists `pending_story_formData` to localStorage so CreateStory's `?resume=true` flow restores the wizard.

Required backend allowlists:
- Supabase Redirect URLs: `https://soulstory.co.il/auth` (kept for post-callback redirect)
- Supabase Site URL: `https://soulstory.co.il`
- Google Cloud Console Authorized redirect URIs: `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`

Iframe-escape (preview only): if `window.self !== window.top`, open `${origin}/auth?returnTo=...` in a new tab.
