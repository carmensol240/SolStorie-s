

## Plan: Switch Google sign-in to direct Supabase OAuth — with one critical correction

### What you asked vs. what will actually work

You asked for `redirectTo: https://soulstory.co.il/auth/v1/callback`.

That path does **not** exist on `soulstory.co.il` — it's Supabase's internal callback path on the Supabase domain (`https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback`). Setting `redirectTo` to a non-existent path on your own domain will give you another 404 immediately after Google auth completes.

Here's how `supabase.auth.signInWithOAuth` actually works:

```text
1. Your app  →  https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/authorize?provider=google&redirect_to=<X>
2. Supabase  →  Google login screen
3. Google    →  https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback   ← Supabase's own callback (fixed, registered in Google Console)
4. Supabase  →  <X>  ← this is what `redirectTo` controls — must be a real page in your app
```

So `redirectTo` must point to a **real route in your React app**, e.g. `/auth` or `/adventure`. The existing `/auth` route already handles the returning session correctly (via `onAuthStateChange` in `use-auth.ts`).

### What I will change

Two files, surgical edits, no UI changes:

#### 1. `src/pages/Auth.tsx` — `handleGoogleSignIn`
Replace the `lovable.auth.signInWithOAuth(...)` call with direct Supabase:

```ts
const handleGoogleSignIn = async () => {
  const returnTo = searchParams.get('returnTo') || localStorage.getItem('returnTo') || '/adventure';

  // Iframe escape stays — preview can't run OAuth inside Lovable's iframe
  if (typeof window !== 'undefined' && window.self !== window.top) {
    window.open(`${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`, '_blank', 'noopener');
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `https://soulstory.co.il/auth?returnTo=${encodeURIComponent(returnTo)}`,
    },
  });
  if (error) {
    toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
  }
};
```

#### 2. `src/components/wizard/GeneratingStep.tsx` — `handleGoogleSignIn`
Same pattern, redirecting back to `/create?resume=true`:

```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `https://soulstory.co.il/create?resume=true`,
  },
});
```

### Backend configuration you must verify (no code change)

For direct `supabase.auth.signInWithOAuth` to succeed against `soulstory.co.il`:

1. **Supabase → Auth → URL Configuration → Redirect URLs allowlist** must contain:
   - `https://soulstory.co.il/**`
   - `https://wwwstorytime.lovable.app/**`
   - `https://id-preview--1702720b-0016-412c-a1d9-a20e9c650989.lovable.app/**`
2. **Supabase → Auth → Site URL** = `https://soulstory.co.il`
3. **Google Cloud Console → Authorized redirect URIs** must contain:
   `https://qvdwmkxviaqcgmjotsxe.supabase.co/auth/v1/callback` (Supabase's own — not your domain)

If any of these are missing, sign-in will still fail. I'll surface a `<lov-open-backend>` button so you can verify them.

### What is NOT changing

- No UI, no Pixar styling, no buttons, no layout, no tablet optimization
- No new routes, no `/auth/v1/callback` route in React (it doesn't belong in your app)
- No `use-auth.ts`, no Supabase client config
- No RLS, no edge functions
- The Google button on `/auth` stays exactly where it is — only the click handler's internal call swaps from `lovable.auth.signInWithOAuth` to `supabase.auth.signInWithOAuth`

### Files touched
- `src/pages/Auth.tsx` (handleGoogleSignIn body only)
- `src/components/wizard/GeneratingStep.tsx` (handleGoogleSignIn body only)

### Memory update
After approval I'll update `mem://auth/google-oauth-production-settings` to reflect the switch from managed Lovable OAuth back to direct Supabase OAuth with `soulstory.co.il` redirect.

