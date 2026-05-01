## Goal
Change the Google OAuth `redirectTo` in `src/pages/Auth.tsx` so Google sends users back to the app's `/auth` page (which already runs the post-login routing logic) instead of the raw Supabase callback URL.

## Change

**File: `src/pages/Auth.tsx`** (line 408, inside `handleGoogleSignIn`)

Replace:
```ts
redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'
```

With:
```ts
redirectTo: `https://soulstory.co.il/auth?returnTo=${encodeURIComponent('/create?resume=true')}`
```

No other code changes. The existing flow above already:
- Persists `returnTo` in `localStorage`
- Handles iframe escape to a top-level tab
- Persists pending educator terms acceptance

## Important caveats to flag

1. **Memory conflict.** The project memory `mem://auth/google-oauth-production-settings` explicitly states `redirectTo` MUST be exactly `'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'` to match Google Console. After this change I will update that memory to reflect the new required value, otherwise future sessions will revert it.

2. **Supabase allowlist (manual step for the user).** For this redirect to work, the Supabase project's **Redirect URLs** allowlist must include:
   - `https://soulstory.co.il/auth`
   - `https://soulstory.co.il/auth?returnTo=*` (wildcard form, if Supabase requires the query string to match)
   
   This cannot be configured from code. The user must verify this in Lovable Cloud → Users → Auth Settings → URL Configuration.

3. **Google Cloud Console.** The Authorized redirect URI in Google Console should remain `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` — that is Google's callback target (the Supabase backend), not the app's post-login redirect. No Google Console change is needed.

4. **Hardcoded `returnTo`.** The new value hardcodes `/create?resume=true`, overriding the `returnTo` computed on line 392 from `searchParams`/`localStorage`. This matches your instruction literally, but it means a user signing in from `/auth` without intending to create a story will still be sent to `/create?resume=true`. If that's undesirable, an alternative is to use the dynamic `returnTo` variable. I will implement exactly what you specified.

## Steps
1. Edit `src/pages/Auth.tsx` line 408 with the new `redirectTo` string.
2. Update `mem://auth/google-oauth-production-settings.md` to document the new redirect URL and Supabase allowlist requirement.
3. Remind the user to verify `https://soulstory.co.il/auth` is in the Supabase Redirect URLs allowlist.