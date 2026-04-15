

## Plan: Add Google Sign-In Button to GeneratingStep Auth Gate

### What changes
Add a "Sign in with Google" button above the email/password form in `GeneratingStep.tsx`, with an "או" (or) divider between them.

### Single file: `src/components/wizard/GeneratingStep.tsx`

**1. Import `signInWithGoogle` from `useAuth`** (line 112)
- Change destructuring to also pull `signInWithGoogle`

**2. Add Google sign-in handler** (after `handleSignupSubmit`, around line 605)
- New `handleGoogleSignIn` async function that:
  - Saves `formData` to `localStorage` as `pending_story_formData` (so the flow resumes after redirect)
  - Calls `signInWithGoogle()` (which uses `lovable.auth.signInWithOAuth("google", { redirect_uri: "https://soulstory.co.il/create?resume=true" })`)
  - Wait — actually `signInWithGoogle` in `use-auth.ts` already redirects to `/consent?returnTo=...`. We need to override the redirect to go back to `/create?resume=true` so story generation resumes.
  - Instead of calling `signInWithGoogle()`, call `lovable.auth.signInWithOAuth("google", ...)` directly with `redirect_uri` pointing to `https://soulstory.co.il/create?resume=true`
  - Shows error toast if it fails

**3. Add Google button + divider in the signup form UI** (line ~814, before the `<form>` tag)
- Google button: gradient white/gray, Google "G" SVG icon, text "המשיכו עם Google"
- Divider: horizontal line with "או" centered
- These go inside the card div, after the heading text and before the `<form>`

### Technical detail

The existing `CreateStory.tsx` already has resume logic (lines 78-91) that restores `formData` from `localStorage` when `?resume=true` is in the URL, sets step to 3, and starts generating. This will work seamlessly after the Google OAuth redirect.

The Google button handler will:
```typescript
const handleGoogleSignIn = async () => {
  // Save form data so CreateStory can resume after redirect
  localStorage.setItem('pending_story_formData', JSON.stringify(formData));
  try {
    const { lovable } = await import("@/integrations/lovable/index");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: "https://soulstory.co.il/create?resume=true",
    });
    if (result.error) {
      toast({ title: "שגיאה", description: "ההתחברות עם Google נכשלה", variant: "destructive" });
    }
  } catch (e) {
    toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
  }
};
```

No other files or flows are modified.

