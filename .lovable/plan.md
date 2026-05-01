## Goal
Fix the Google OAuth `redirectTo` in `src/components/wizard/AuthStep.tsx` so it matches `src/pages/Auth.tsx`. Currently it points to the raw Supabase callback URL, which means after Google completes OAuth, Supabase has nowhere app-side to send the user, breaking the post-login routing logic in `OAuthReturnHandler`.

## Change

**File:** `src/components/wizard/AuthStep.tsx` (inside `handleGoogleSignIn`, the non-iframe branch)

Replace:
```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'
  }
});
```

With:
```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `https://soulstory.co.il/auth?returnTo=${encodeURIComponent('/create?resume=true')}`
  }
});
```

No other changes. The surrounding logic (persisting `pending_story_formData`, `returnTo` in localStorage + cookie, and the iframe-escape branch which already uses `https://soulstory.co.il/auth?returnTo=...`) stays as-is.

## Notes

- `qvdwmkxviaqcgmjotsxe.supabase.co` also appears in `src/integrations/supabase/client.ts`. That file is auto-generated and must NOT be edited — it's the actual Supabase project ref for this project's backend, unrelated to the OAuth `redirectTo` issue. Leaving it alone is correct.
- Required (manual, outside code): `https://soulstory.co.il/auth` must be in the Supabase Auth Redirect URLs allowlist, and Site URL should be `https://soulstory.co.il`. Google Cloud Console authorized redirect URI stays as `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` (Google → Supabase hop is unchanged).
- After the change, both entry points (`Auth.tsx` and `AuthStep.tsx`) will be consistent, and `OAuthReturnHandler` will pick up `returnTo` and route the user to `/create?resume=true` to resume the wizard.
