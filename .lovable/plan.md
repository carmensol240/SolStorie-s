

## Plan: Add Google Sign-In to the GeneratingStep Signup Form

### Challenge
Google OAuth requires a full-page redirect to Google's login screen. When the user is redirected, the current story creation context (formData) is lost. We need to persist formData to localStorage before redirecting so it can be restored after the OAuth callback.

### Changes

#### 1. `src/components/wizard/GeneratingStep.tsx`
- Import `signInWithGoogle` from `useAuth` (line 94)
- Before calling `signInWithGoogle`, save `formData` to `localStorage` under key `pending_story_formData`
- Add a Google sign-in button above the email/password form with a divider ("או")
- The button calls a `handleGoogleSignup` function that:
  1. Saves `formData` to `localStorage.setItem('pending_story_formData', JSON.stringify(formData))`
  2. Sets `localStorage.setItem('returnTo', '/create?resume=true')`
  3. Calls `signInWithGoogle()`

#### 2. `src/pages/CreateStory.tsx`
- On mount, check for `resume=true` query param AND `pending_story_formData` in localStorage
- If found: restore formData from localStorage, skip to step 3 (GeneratingStep), clear the localStorage key
- This handles the return from Google OAuth — the user lands back on `/create?resume=true`, formData is restored, and generation begins automatically since the user is now authenticated

### UI for the Google button (in GeneratingStep)
```
[Google icon] המשיכו עם Google
─────── או ───────
[email/password form as-is]
```

Styled as a white button with border, matching the compact form style.

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — add Google button + persist formData before redirect
2. `src/pages/CreateStory.tsx` — restore formData from localStorage on OAuth return

