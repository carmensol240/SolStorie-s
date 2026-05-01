## Problem

After completing Google OAuth from AuthStep (step 2 of `/create`), the user lands on `/adventure` instead of returning to `/create?resume=true` to continue the wizard.

## Root Cause

The OAuth flow in AuthStep stores the return target in two places before redirecting to Google:
- `localStorage.setItem('returnTo', '/create?resume=true')`
- Cookie `ss_return_to=/create?resume=true`

After Google authentication, Supabase's OAuth callback redirects back to the project's configured **Site URL**, which lands the user on `/` — and `/` is mapped to the `Adventure` page in `App.tsx`:

```
<Route path="/" element={<Adventure />} />
```

The `returnTo` reading logic exists only inside `src/pages/Auth.tsx` (`getReturnTo` + the terms-check effect, lines 257–324). That effect runs only when the user lands on `/auth`. After Google OAuth they land on `/`, so the `returnTo` value is read by nobody and Adventure renders.

There is no global listener that consumes `returnTo` on `SIGNED_IN`, so the saved destination is silently ignored.

## Fix

Add a small global handler that runs once at app startup (inside the Router) and, on a Supabase `SIGNED_IN` event, navigates to the saved `returnTo` (cookie first, then localStorage), then clears both.

### Implementation

1. **New component** `src/components/auth/OAuthReturnHandler.tsx`:
   - Subscribes to `supabase.auth.onAuthStateChange`.
   - On event `SIGNED_IN`, reads return target from cookie `ss_return_to` first (mobile-safe), then `localStorage.returnTo`.
   - Validates it (must start with `/`, not `//`) — same rules as the existing `getReturnTo` in `Auth.tsx`.
   - If a valid relative path exists AND it differs from the current path, calls `navigate(returnTo, { replace: true })`.
   - Always clears both storages (`localStorage.removeItem('returnTo')` + zero-Max-Age cookie) after consuming.
   - Renders nothing.

2. **Mount it** in `src/App.tsx` once, inside `<BrowserRouter>` so it has router context, alongside the existing global components (e.g. `ScrollToTop`).

### Why this is safe

- It runs only on `SIGNED_IN`, so it does not interfere with already-logged-in sessions or sign-out.
- It only navigates when a `returnTo` value is actually stored — normal Google sign-ins from `/auth` (which already handle `returnTo` themselves) will see the value cleared by `Auth.tsx` first, leaving nothing for this handler to do. If both run, the destinations are identical, so the redundant navigate is a no-op (`replace: true` to same path).
- It uses the same validation as `Auth.getReturnTo` to prevent open-redirect vulnerabilities.
- AuthStep's existing pre-OAuth code (sets `pending_story_formData`, `returnTo`, `ss_return_to` cookie) is unchanged. `CreateStory.tsx` already consumes `?resume=true` and `pending_story_formData` to restore the wizard at step 4 — that part already works; this fix just gets the user back to `/create?resume=true` so it can run.

No other files are touched.
