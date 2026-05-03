## Root Cause

When the user's Supabase session has expired, `supabase.auth.refreshSession()` (called at line 224 of `src/components/wizard/GeneratingStep.tsx` before invoking `generate-story`) throws `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`. This error is caught by the generic catch block on line 232, treated like any other fetch error, and fed into the retry loop — which eventually surfaces as the generic "לא הצלחנו ליצור את הסיפור" toast. The user is never told their session expired and is never sent back to log in.

## Fix

Detect expired-session errors specifically and redirect to the login screen with a clear Hebrew message and a `returnTo` that resumes the wizard right where the user was.

### 1. Add a helper to detect expired-session errors

In `src/components/wizard/GeneratingStep.tsx`, add a small helper that recognizes the relevant Supabase auth errors:

- `error.name === "AuthApiError"` AND message contains `Refresh Token` / `refresh_token_not_found` / `Invalid Refresh Token`
- Generic message includes `JWT expired` or `session_not_found`

### 2. Handle it before retrying

Wrap the `refreshSession()` call in its own try/catch. If it fails with an expired-session error:

1. Persist the in-progress wizard state so we can resume:
   - `localStorage.setItem('pending_story_formData', JSON.stringify(formData))` (this key is already consumed by `CreateStory.tsx` when `?resume=true` is present).
2. Show a toast: **"פג תוקף החיבור, אנא התחבר מחדש"**.
3. Navigate to `/auth?returnTo=/create?resume=true` (URL-encoded). `OAuthReturnHandler` and the existing email-login redirect logic will send the user back to `/create?resume=true`, which re-hydrates `formData` and re-enters the generating step.
4. `return` immediately — do NOT enter the retry loop and do NOT call `setError`.

### 3. Also handle the same error if it surfaces from `functions.invoke`

In the existing error handling block (around lines 242–262 and the outer catch at 299), add the same detection: if `apiError`/`err` looks like an expired-session error, run the same persist-toast-redirect flow instead of retrying.

### 4. Scope guard

No changes to `Auth.tsx`, `OAuthReturnHandler`, `useAuth`, or any other feature. Only `src/components/wizard/GeneratingStep.tsx` is touched. The existing `?resume=true` mechanism in `CreateStory.tsx` is reused as-is.

## Technical details

- File edited: `src/components/wizard/GeneratingStep.tsx` only.
- New helper (local to file):
  ```ts
  const isSessionExpiredError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    const name = (e as any)?.name ?? "";
    return (
      name === "AuthApiError" && /refresh.?token|invalid refresh/i.test(msg)
    ) || /refresh_token_not_found|JWT expired|session_not_found/i.test(msg);
  };
  ```
- Reuse existing keys: `pending_story_formData` (already restored in `CreateStory.tsx` lines ~85–100) and the `returnTo` query param (already consumed by `OAuthReturnHandler` and the email login flow).
- Toast uses the existing `useToast` import already present in the file.