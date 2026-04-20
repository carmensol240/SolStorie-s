

## Plan: Re-enable Google Sign-In Button

### Single file: `src/components/wizard/GeneratingStep.tsx`

**1. Restore `handleGoogleSignIn` function** to use Supabase directly with `window.location.origin`:

```typescript
const handleGoogleSignIn = async () => {
  try {
    // Persist form data so we can resume after the OAuth redirect
    localStorage.setItem('pending_story_formData', JSON.stringify(formData));
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/create?resume=true`,
      },
    });
    
    if (error) {
      toast({ 
        title: "שגיאה", 
        description: "ההתחברות עם Google נכשלה", 
        variant: "destructive" 
      });
    }
  } catch (e) {
    toast({ 
      title: "שגיאה", 
      description: "אירעה שגיאה, נסו שוב", 
      variant: "destructive" 
    });
  }
};
```

**2. Re-enable the button** (the one currently showing "בקרוב 🔒"):
- Remove the `disabled` attribute
- Add back `onClick={handleGoogleSignIn}`
- Remove `opacity-50 cursor-not-allowed` classes
- Restore `hover:bg-gray-50` for the hover effect
- Change text from `בקרוב 🔒` back to `המשיכו עם Google`

The existing resume logic in `CreateStory.tsx` (which reads `?resume=true` and restores `pending_story_formData`) is unchanged — it already handles the post-redirect flow.

### What stays the same
- Email/password form, divider ("או"), all surrounding layout
- The `supabase` import (already present at the top of the file)
- All other buttons, components, and pages

### Note
Uses `supabase.auth.signInWithOAuth` directly (not the Lovable wrapper) since the user has configured their own Google OAuth credentials in the Supabase backend. `window.location.origin` ensures the redirect works in both preview and production environments — make sure both origins are added to the Google OAuth authorized redirect URIs and to Supabase's auth redirect allowlist.

