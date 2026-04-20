
## Force Google OAuth to use the backend callback URL

### Current state confirmed
- `/auth` is already mapped correctly in `src/App.tsx`
- Three Google OAuth entry points currently hardcode `https://soulstory.co.il/auth`:
  - `src/pages/Auth.tsx`
  - `src/components/wizard/GeneratingStep.tsx`
  - `src/hooks/use-auth.ts`

### Important correction before implementation
- The callback host in your last message appears misspelled:
  - pasted: `https://qvdwmkwviacgmjotsxe.supabase.co/auth/v1/callback`
  - this project’s callback host: `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`
- The implementation should use the real callback URL for this project. If you intentionally meant the pasted hostname, that URL will not match this project.

### Changes to make
1. `src/pages/Auth.tsx`
   - Replace the Google sign-in call with this hardcoded structure:
   ```ts
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: 'https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback'
     }
   })
   ```
   - Keep the button UI, toast behavior, and surrounding auth flow unchanged.
   - Keep existing `returnTo` localStorage persistence unchanged.

2. `src/components/wizard/GeneratingStep.tsx`
   - Replace its Google sign-in call with the same hardcoded callback URL.
   - Keep `pending_story_formData` and `returnTo` localStorage writes unchanged so the resume data is still preserved on the client.

3. `src/hooks/use-auth.ts`
   - Update the shared `signInWithGoogle` helper to use the same hardcoded callback URL so no fallback path still points to `https://soulstory.co.il/auth`.

4. `src/App.tsx`
   - No routing change needed. `/auth` is already registered correctly and should remain untouched.

5. Memory sync
   - Update `mem://auth/google-oauth-production-settings` so project memory matches the forced callback-based configuration.

### What will not change
- No UI or styling changes
- No Disney/Pixar visual changes
- No tablet/mobile layout changes
- No new routes or pages
- No auth copy changes
- No backend schema, policies, or functions

### Technical note
- This is a forced configuration change exactly as requested.
- It replaces the current app-route redirect pattern with the backend callback URL, so post-login return navigation may behave differently from the current `/auth` flow.

### Files to update
- `src/pages/Auth.tsx`
- `src/components/wizard/GeneratingStep.tsx`
- `src/hooks/use-auth.ts`
- `mem://auth/google-oauth-production-settings`

### Verification after implementation
- Confirm all Google OAuth call sites use the same hardcoded callback URL
- Confirm there are no remaining Google sign-in references to `https://soulstory.co.il/auth`
- Confirm `/auth` is still mapped in `App.tsx`
