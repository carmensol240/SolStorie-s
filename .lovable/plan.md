## Goal

On mobile, when a user clicks "Continue with Google" from the story-loading screen (`GeneratingStep`), they should return to `/create?resume=true` after authenticating — not be redirected to `/adventure`. On desktop this already works. Per the request: only save the URL before redirect and only restore it after auth — no other changes.

## Root Cause

Today, `returnTo` is persisted to `localStorage` only:

- `src/components/wizard/GeneratingStep.tsx` (line 611): `localStorage.setItem('returnTo', '/create?resume=true')`
- `src/pages/Auth.tsx` `getReturnTo()` (lines 258–265): reads `searchParams.get('returnTo') || localStorage.getItem('returnTo') || '/adventure'`

On mobile (especially iOS Safari / in-app browsers), the Google OAuth flow can land back in a context where the original tab's `localStorage` value is not visible at the moment `/auth` runs `getReturnTo()` — for example when the callback opens in a new tab, when an in-app browser hands off to the system browser, or when ITP / storage partitioning briefly hides the value. The lookup falls through to the `'/adventure'` default. Desktop usually keeps the same tab/context, so `localStorage` is intact.

We can't change `redirectTo` (locked to the Supabase callback per project memory) and Supabase strips arbitrary query params from the callback URL, so we need a more reliable client-side persistence layer that survives cross-tab/cross-context navigation on mobile.

## Change

Add a **cookie-based fallback** alongside the existing `localStorage` write/read. Cookies on the same eTLD+1 are shared across all tabs and survive context handoffs that can affect `localStorage` on mobile.

### 1. `src/components/wizard/GeneratingStep.tsx` — `handleGoogleSignIn` (around line 608)

Before initiating OAuth, also write the return URL to a cookie. Keep the existing `localStorage` writes untouched.

```ts
const handleGoogleSignIn = async () => {
  if (!GOOGLE_SIGNIN_ENABLED) return;
  localStorage.setItem('pending_story_formData', JSON.stringify(formData));
  localStorage.setItem('returnTo', '/create?resume=true');
  // NEW: cookie fallback for mobile (localStorage can be lost across OAuth context switches)
  document.cookie =
    'ss_return_to=' + encodeURIComponent('/create?resume=true') +
    '; Max-Age=600; Path=/; SameSite=Lax; Secure';
  try {
    // ...existing OAuth code unchanged...
  }
};
```

`Max-Age=600` (10 minutes) is enough for the round trip and auto-expires so it doesn't linger.

### 2. `src/pages/Auth.tsx` — `getReturnTo()` (lines 258–265)

Add the cookie as a fallback source, and clear it after use. No other changes.

```ts
const getReturnTo = () => {
  // NEW: read cookie fallback
  const cookieMatch = document.cookie.match(/(?:^|;\s*)ss_return_to=([^;]+)/);
  const cookieReturnTo = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  const returnTo =
    searchParams.get('returnTo') ||
    localStorage.getItem('returnTo') ||
    cookieReturnTo ||
    '/adventure';

  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }
  return '/adventure';
};
```

In the existing post-auth redirect block (around lines 297–306) where `localStorage.removeItem('returnTo')` is already called, also clear the cookie:

```ts
localStorage.removeItem('returnTo');
document.cookie = 'ss_return_to=; Max-Age=0; Path=/; SameSite=Lax; Secure';
```

## Why this works on mobile

- Cookies set with `Path=/; SameSite=Lax; Secure` on `soulstory.co.il` are visible to every same-origin tab/context, including a fresh tab opened by the OS handing off from an in-app browser after the Supabase callback.
- `localStorage` continues to work as the primary source on desktop and on mobile when the original tab is reused, so existing behavior is preserved.
- The default `/adventure` is only used when both sources are empty (true new logins).

## Out of Scope

- No changes to OAuth provider, `redirectTo`, Supabase config, or the iframe-escape branch.
- No changes to navigation logic, auth state handling, or any other component.
- No refactoring of `getReturnTo` beyond adding the cookie fallback.
- No changes for the `Auth.tsx` `handleGoogleSignIn` path (this request is specifically about the story-loading screen flow). The cookie fallback in `getReturnTo` is read-only there and harmless.
