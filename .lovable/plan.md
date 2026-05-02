# Fix: `returnTo` ignored after Google OAuth — only `/auth` is reached

## Problem

After Google OAuth, the user lands at `https://soulstory.co.il/auth?returnTo=%2Fcreate%3Fresume%3Dtrue` and stays there instead of being forwarded to `/create?resume=true`.

`OAuthReturnHandler` (the global handler the user asked me to fix) currently reads `returnTo` from only two places:

1. Cookie `ss_return_to`
2. `localStorage.getItem('returnTo')`

It does **not** read the `?returnTo=` query parameter from the current URL. During Google OAuth the browser navigates away to `accounts.google.com`, then to Supabase's callback, then back to our domain. On mobile Safari, in-app browsers, and any cross-site/ITP scenario, the cookie and `localStorage` value set before the redirect can be wiped or hidden from the returning context. When that happens, `OAuthReturnHandler` finds nothing and returns early — even though the URL itself still carries `?returnTo=/create?resume=true` (because that is exactly the `redirectTo` we passed to `signInWithOAuth`).

`Auth.tsx` has its own effect that does read `searchParams.get('returnTo')`, but it is gated behind a profile/terms DB lookup and a `setCheckingTerms` cycle, so in practice users see `/auth` first and the navigation can be missed (or pre-empted by other UI states on that page).

The user's instruction is explicit: only fix `OAuthReturnHandler`, do not touch anything else.

## Change

Update `src/components/auth/OAuthReturnHandler.tsx` so it picks up `returnTo` from **all three** sources, in this priority order:

1. URL query param `returnTo` on the current location (most reliable — it survives the OAuth round-trip because it's literally in the URL Supabase redirects to)
2. Cookie `ss_return_to`
3. `localStorage.getItem('returnTo')`

Keep all existing behavior:

- Trigger on `SIGNED_IN` and on `INITIAL_SESSION` when a session exists
- Always clear cookie + localStorage after consuming
- Open-redirect protection: only accept values starting with `/` and not `//`
- Skip navigation if the resolved path equals the current path+search (prevents loop)
- Important refinement to that skip check: when we are sitting on `/auth?returnTo=/create?resume=true` and the resolved value is `/create?resume=true`, those are not equal, so navigation will proceed. Good.

No other files are modified. No router config, no `Auth.tsx`, no `AuthStep.tsx` changes.

## Technical details

File: `src/components/auth/OAuthReturnHandler.tsx`

Inside the `onAuthStateChange` callback, replace the current source-resolution block with:

```ts
// 1. URL query param (survives the OAuth round-trip)
const urlReturnTo = new URLSearchParams(window.location.search).get("returnTo");

// 2. Cookie (mobile-safer than localStorage across OAuth context switches)
const cookieMatch = document.cookie.match(/(?:^|;\s*)ss_return_to=([^;]+)/);
const cookieReturnTo = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

// 3. localStorage fallback
let lsReturnTo: string | null = null;
try { lsReturnTo = localStorage.getItem("returnTo"); } catch {}

const raw = urlReturnTo || cookieReturnTo || lsReturnTo;
```

Everything after that (clear cookie + localStorage, validate, compare against `currentPath`, `navigate(raw, { replace: true })`) stays as it is today.

## Verification

After the change, this flow should work end-to-end:

1. User clicks "Continue with Google" in `AuthStep` (wizard) or `Auth` page
2. Supabase redirects to `https://soulstory.co.il/auth?returnTo=%2Fcreate%3Fresume%3Dtrue`
3. `OAuthReturnHandler` fires on `INITIAL_SESSION`, reads `returnTo=/create?resume=true` from the URL, clears storage, calls `navigate("/create?resume=true", { replace: true })`
4. `CreateStory` mounts with `?resume=true` and restores wizard state from `pending_story_formData`

Works even if cookies / localStorage were dropped during the OAuth bounce.

## Out of scope (per user instruction)

- No changes to `Auth.tsx`, `AuthStep.tsx`, routing, Supabase config, or memory files.
