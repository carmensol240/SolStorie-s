

## Plan: Fix `redirect_uri_mismatch` — clarification first

### What you asked me to do
Set `redirectTo: window.location.origin + '/auth/v1/callback'` in `handleGoogleSignIn` (in `src/components/wizard/GeneratingStep.tsx`).

### Why I am NOT doing that without confirmation
`/auth/v1/callback` is **Supabase's internal OAuth callback path on the Supabase domain** (`https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`). It does **not** exist on your app domain.

The `redirectTo` parameter in `supabase.auth.signInWithOAuth` is **not** the URL you register in Google Console. It's the page Supabase sends the user back to **after** the full OAuth round-trip completes (i.e. a page in your app, like `/create?resume=true`).

The OAuth flow works like this:

```text
1. Your app  →  Google login screen
2. Google    →  https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback   ← THIS is what Google Console needs
3. Supabase  →  redirectTo URL in your app (e.g. /create?resume=true)        ← THIS is the redirectTo param
```

So the real fix for `redirect_uri_mismatch error 400` is almost always one of these:

1. **Google Cloud Console → Authorized redirect URIs** must contain exactly:
   `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`
2. **Supabase → Auth → URL Configuration → Redirect URLs (allowlist)** must contain your app origins:
   - `https://id-preview--1702720b-0016-412c-a1d9-a20e9c650989.lovable.app/**`
   - `https://wwwstorytime.lovable.app/**`
   - your custom domain if any
3. **Site URL** in Supabase auth settings should be set to your production origin.

The current code (`redirectTo: ${window.location.origin}/create?resume=true`) is correct and should stay.

### What I need from you (pick one)

**A. Recommended — fix the configuration (no code change needed):**
- Open Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client → add `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` under Authorized redirect URIs.
- Open the backend dashboard → Auth → URL Configuration → add your preview + published origins to the Redirect URLs allowlist.
- Reply: **"Configured, please verify."** and I will help test.

**B. You really want the code change anyway:**
Change line 613 in `src/components/wizard/GeneratingStep.tsx` from
`redirectTo: ${window.location.origin}/create?resume=true`
to
`redirectTo: ${window.location.origin}/auth/v1/callback`.
**Warning:** this will almost certainly break sign-in entirely, because there is no `/auth/v1/callback` route in your React app — Supabase will redirect the user to a 404 after Google login. The session will be set on the URL hash but no resume logic will run.
Reply: **"Apply B anyway."**

**C. Use the managed Lovable Cloud OAuth instead** (recommended long-term — already configured for `soulstory.co.il`, no Google Console fiddling needed):
Switch `handleGoogleSignIn` to call `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/create?resume=true" })` (same wrapper used in `use-auth.ts`). This bypasses Google Console redirect-URI configuration entirely.
Reply: **"Apply C."**

