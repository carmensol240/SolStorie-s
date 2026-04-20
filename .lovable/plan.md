

## Plan: Diagnose `ERR_BLOCKED_BY_RESPONSE` (preview-only)

### What's actually happening

`ERR_BLOCKED_BY_RESPONSE` on Google sign-in **inside the Lovable preview iframe** is an environment limitation, not a bug in your app:

- The preview runs your app inside an `<iframe>` on `lovableproject.com`.
- Google's OAuth screens send `X-Frame-Options: DENY` / `Content-Security-Policy: frame-ancestors`. The browser refuses to render Google inside the iframe → `ERR_BLOCKED_BY_RESPONSE`.
- Safari (and Chrome incognito) additionally block third-party cookies inside iframes, which breaks the session round-trip even when the redirect succeeds.

This is why the **same code works on the published URL** (`https://wwwstorytime.lovable.app`) but fails inside the preview iframe.

### What the requested "fix" would and would not do

> "Open Google login in a new window (popup) or full-page redirect, not inside an iframe."

- **Full-page redirect** is already what the code does (`window.location.href = ...` via `lovable.auth.signInWithOAuth`). It's the iframe itself — not the code — that the redirect happens inside, so the redirect target is still blocked by Google's frame headers.
- **Popup-based OAuth** is not supported by `lovable.auth.signInWithOAuth` or `supabase.auth.signInWithOAuth`. Both are redirect-only flows. Implementing a custom popup OAuth handler would be a large rewrite, would still hit Safari's third-party-cookie block, and would break the working production flow.

The standard, correct way to test Google sign-in for a Lovable project is to **test on the published URL**, not the preview iframe.

### What I will do

#### 1. Open the preview in a new tab (workaround for the iframe block)

Add a small helper in `src/components/wizard/GeneratingStep.tsx` and `src/pages/Auth.tsx`: if the app detects it is running inside an iframe (`window.self !== window.top`), the Google button will instead open the same page in a new top-level browser tab before triggering OAuth. In a top-level tab, Google's frame headers no longer apply and the flow works normally — both in the preview environment and in the published site.

Pseudo:
```ts
const handleGoogleSignIn = async () => {
  if (window.self !== window.top) {
    // We're inside the Lovable preview iframe — pop out to a real tab first
    window.open(window.location.href, '_blank', 'noopener');
    return;
  }
  const { lovable } = await import("@/integrations/lovable/index");
  await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}`,
  });
};
```

This change is invisible on the published site (where `window.self === window.top`) and only kicks in inside the preview iframe.

#### 2. Verify admin vs. regular user data isolation (no code change needed)

Already verified in previous round and unchanged:
- `Library.tsx`, `Adventure.tsx`, `LoggedInHome.tsx` all filter by `.eq("user_id", user.id)`.
- RLS on `stories`: regular users see only their own; `has_role(auth.uid(), 'admin')` policy lets admins see all; anon blocked.

I will re-run the Supabase linter after the change to confirm nothing regressed.

#### 3. Verify session persistence (no code change needed)

`src/integrations/supabase/client.ts` already configures:
```ts
auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
```

This means sessions survive refresh and tab close. No change needed.

### Files touched

- `src/pages/Auth.tsx` — wrap `handleGoogleSignIn` with the iframe-escape guard.
- `src/components/wizard/GeneratingStep.tsx` — same guard on its `handleGoogleSignIn`.

### Files NOT touched

- No UI, design, layout, navigation, tailwind, or design tokens
- No RLS policies, no edge functions, no Supabase config
- No `use-auth.ts`, no client config, no other components

### Important note for testing

After this change:
- **Inside the Lovable preview iframe**: clicking "המשיכו עם Google" will open a new browser tab on the same URL — sign in there. This is the only reliable way to test Google OAuth from the preview.
- **On the published site (`wwwstorytime.lovable.app`)** and on `localhost`: behavior is unchanged — Google sign-in works inline as before.
- If after testing on the **published URL** Google sign-in still fails with `ERR_BLOCKED_BY_RESPONSE`, that would indicate a real configuration issue (not the preview iframe), and we will diagnose from there.

