
## Fix: force Google OAuth to use the exact hardcoded custom-domain redirect

### Current state confirmed
- `App.tsx` already maps `/auth` correctly:
  `\<Route path="/auth" element={\<Auth />} />`
- The active Google sign-in handlers in:
  - `src/pages/Auth.tsx`
  - `src/components/wizard/GeneratingStep.tsx`
  already use `redirectTo: 'https://soulstory.co.il/auth'`
- The remaining problems are:
  1. both handlers still use `window.location.origin` in the preview iframe escape flow
  2. `src/hooks/use-auth.ts` still contains older Google OAuth logic using `lovable.auth.signInWithOAuth(...)` and a different redirect path

### What will be changed

#### 1. `src/pages/Auth.tsx`
Update `handleGoogleSignIn` so the Google flow uses only:
```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://soulstory.co.il/auth'
  }
})
```

Also update the iframe escape logic so it does **not** use `window.location.origin`; it will open the hardcoded URL directly in a new tab:
```ts
window.open('https://soulstory.co.il/auth', '_blank', 'noopener')
```

`returnTo` will continue to be preserved via `localStorage`, not query params.

#### 2. `src/components/wizard/GeneratingStep.tsx`
Apply the same exact OAuth structure:
```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://soulstory.co.il/auth'
  }
})
```

Also replace the iframe escape URL with the same hardcoded `https://soulstory.co.il/auth` new-tab open.

Keep the existing `localStorage` persistence for:
- `pending_story_formData`
- `returnTo = '/create?resume=true'`

So the user still returns to the resume flow after auth.

#### 3. `src/hooks/use-auth.ts`
Replace the stale Google helper so there is no fallback path left in the codebase that can still call:
- `lovable.auth.signInWithOAuth(...)`
- `redirect_uri: .../consent...`

This keeps all Google auth code paths consistent with the exact hardcoded URL requirement and prevents regressions.

#### 4. `src/App.tsx`
No routing change needed unless a mismatch is found while editing. `/auth` is already correctly registered to the authentication page, so this file should remain functionally unchanged.

### What will NOT change
- No UI changes
- No styling changes
- No Disney/Pixar visuals changes
- No tablet/mobile layout changes
- No navigation restructuring
- No new pages
- No `/auth/v1/callback` React route

### Technical behavior after the fix
```text
Google button click
→ localStorage saves returnTo / pending form state
→ preview iframe case: open hardcoded https://soulstory.co.il/auth in a new tab
→ normal case: call supabase.auth.signInWithOAuth(...)
   with redirectTo: 'https://soulstory.co.il/auth'
→ after login, auth session returns to /auth
→ existing auth/session logic redirects user using localStorage
```

### Files to update
- `src/pages/Auth.tsx`
- `src/components/wizard/GeneratingStep.tsx`
- `src/hooks/use-auth.ts`
- optional memory sync:
  - `mem://auth/google-oauth-production-settings`

### Final confirmation to provide after implementation
I will explicitly confirm that the Google sign-in flow uses the hardcoded string:
`https://soulstory.co.il/auth`
and does not use `window.location.origin` or environment variables for that redirect.
