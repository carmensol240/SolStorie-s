## Fix

In `src/components/wizard/AuthStep.tsx`, remove the iframe-detection branch in `handleGoogleSignIn`:

```ts
if (typeof window !== 'undefined' && window.self !== window.top) {
  window.open('https://soulstory.co.il/auth', '_blank', 'noopener');
  return;
}
```

This branch fires inside the Lovable preview (which wraps the app in an iframe) and incorrectly redirects to `/auth` on the production domain instead of starting Google OAuth. In all real user contexts (mobile browser, desktop browser, installed PWA, custom domain, published site), the app is not in an iframe, so the branch never fires — removing it is safe.

After removal, `handleGoogleSignIn` calls `supabase.auth.signInWithOAuth({ provider: 'google', ... })` directly in every context. All other logic (form data persistence to localStorage, `returnTo` cookie, hardcoded Supabase callback URL, error toast) is unchanged. No other files touched.
