## Plan: Restore iframe-escape branch in `handleGoogleSignIn`

### Root cause

The 403 happens only inside the Lovable preview iframe. Google's OAuth consent screen sets `X-Frame-Options: DENY` / `frame-ancestors 'none'`, so when `supabase.auth.signInWithOAuth` redirects the **iframe itself** to Google, Google refuses to render and the browser shows a 403-style "refused to display" error.

The previously-removed branch detected this case (`window.self !== window.top`) and opened the OAuth flow in a new **top-level** tab, which Google allows. The project memory `auth/google-oauth-production-settings.md` explicitly documents this as required behavior:
> "Iframe-escape (preview only): if `window.self !== window.top`, open `${origin}/auth?returnTo=...` in a new tab."

The supabase auth logs confirm the recent `/authorize` requests from the preview domain return `302` successfully — Supabase is fine; the failure is Google refusing to render inside the iframe. (The unrelated `invalid_client` errors from `wwwstorytime.lovable.app` predate this change and are a separate backend configuration matter, not in scope here.)

### Change

In `src/components/wizard/AuthStep.tsx`, inside `handleGoogleSignIn`, re-add the iframe-escape branch **before** the `supabase.auth.signInWithOAuth` call. Nothing else changes.

```ts
// Iframe-escape: preview runs inside Lovable iframe; Google OAuth
// consent refuses to render in a third-party iframe (X-Frame-Options).
// Open the live /auth flow in a new top-level tab instead.
if (typeof window !== 'undefined' && window.self !== window.top) {
  const returnTo = encodeURIComponent('/create?resume=true');
  window.open(
    `https://soulstory.co.il/auth?returnTo=${returnTo}`,
    '_blank',
    'noopener,noreferrer'
  );
  return;
}
```

This branch only triggers inside an iframe (i.e. the Lovable preview). On the published site, on mobile browsers, and in the PWA, `window.self === window.top`, so the existing direct `signInWithOAuth` call runs unchanged — production behavior is not affected.

### Files touched

- `src/components/wizard/AuthStep.tsx` — restore the iframe-escape branch only.

No other files, no auth backend changes, no routing changes.