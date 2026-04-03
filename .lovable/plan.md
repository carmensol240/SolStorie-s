

## Plan: Fix Google OAuth 404 Error

### Root Cause
The `signInWithGoogle` function in `use-auth.ts` (line 49) uses `supabase.auth.signInWithOAuth()` directly instead of the Lovable Cloud managed `lovable.auth.signInWithOAuth()`. This causes a 404 because the Supabase direct OAuth flow isn't configured for this Cloud project.

Additionally, `GeneratingStep.tsx` (line 791) uses `redirect_uri: window.location.origin` which works in preview but not on the published domain.

### Fix — `src/hooks/use-auth.ts`

Replace the `signInWithGoogle` function to use `lovable.auth.signInWithOAuth("google")` with `redirect_uri` pointing to `https://soulstory.co.il`:

```typescript
const signInWithGoogle = async () => {
  try {
    const { lovable } = await import("@/integrations/lovable/index");
    const returnTo = localStorage.getItem('returnTo') || '/library';
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `https://soulstory.co.il/consent?returnTo=${encodeURIComponent(returnTo)}`,
    });
    if (result.error) {
      return { error: result.error };
    }
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
};
```

### Fix — `src/components/wizard/GeneratingStep.tsx`

Update `redirect_uri` on line 791 from `window.location.origin` to `https://soulstory.co.il`:

```typescript
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: "https://soulstory.co.il",
});
```

### Files modified
1. `src/hooks/use-auth.ts` — switch to `lovable.auth.signInWithOAuth`, set redirect to published domain
2. `src/components/wizard/GeneratingStep.tsx` — update `redirect_uri` to published domain

