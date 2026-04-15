

## Plan: Fix Google OAuth 404 by using Supabase directly

### Problem
The `lovable.auth.signInWithOAuth` call routes through `~oauth/initiate` which returns 404.

### Fix — single file: `src/components/wizard/GeneratingStep.tsx`

**Replace lines 607–620** — the `handleGoogleSignIn` function:

```typescript
const handleGoogleSignIn = async () => {
  localStorage.setItem('pending_story_formData', JSON.stringify(formData));
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://soulstory.co.il/create?resume=true',
      },
    });
    if (error) {
      toast({ title: "שגיאה", description: "ההתחברות עם Google נכשלה", variant: "destructive" });
    }
  } catch (e) {
    toast({ title: "שגיאה", description: "אירעה שגיאה, נסו שוב", variant: "destructive" });
  }
};
```

- `supabase` is already imported at the top of the file
- Uses `redirectTo` (Supabase SDK param) instead of `redirect_uri`
- Points back to `/create?resume=true` so the existing resume logic in `CreateStory.tsx` restores form data and continues generation
- No other changes

