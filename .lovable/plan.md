

## Plan: Fix Guest Story Generation Auth Bypass

### Root Cause
When `supabase.functions.invoke("generate-story", ...)` is called, the Supabase JS client **always** sends an `Authorization: Bearer <token>` header — even for unauthenticated users. For guests, this token is the **anon key** or a **stale/expired session token**. 

The edge function checks `guestMode` first (line 598), which is correct. But if the user is NOT in guest mode AND has a bad token, the `else` branch (line 609) validates the token and returns 401.

The current code at line 199 sets `isGuest = !user`, which correctly sends `guestMode: true`. The edge function at line 598 checks `guestMode` first before auth — so the flow *should* work.

However, there's a subtle issue: `supabase.functions.invoke` can throw a `FunctionsHttpError` for non-2xx responses, and the error handling at line 241-251 catches 401 errors and redirects to auth — even though the request was meant to be guest mode. Also, if the edge function hits a 402 from the AI gateway, it returns an error that gets misinterpreted.

### The Fix — `supabase/functions/generate-story/index.ts`

The edge function's guest mode flow is correct. The real issue is that when the **AI gateway** returns a 402 (credits exhausted), the error response is returned as a 500 with a generic message, making it look like an auth failure on the client. 

**Change 1**: In the edge function, ensure the guest mode check is truly first and unconditional — move it before ANY auth header inspection. Currently it's at line 598 which is correct, but add a log to confirm guest requests are reaching this branch.

**Change 2**: The client-side code in `GeneratingStep.tsx` uses `supabase.functions.invoke()` which automatically includes auth headers. For guest mode, use a **raw `fetch()` call instead** — this avoids sending any Authorization header entirely, ensuring the edge function's guest path is always hit cleanly.

This is the key fix: replace `supabase.functions.invoke` with a direct `fetch` when `isGuest` is true, so no auth token is sent at all.

### Changes — `src/components/wizard/GeneratingStep.tsx` (lines 221-231)

Replace the single `supabase.functions.invoke` call with a conditional:
- If `isGuest`: use `fetch()` directly to the edge function URL (constructed from `VITE_SUPABASE_URL`), with no Authorization header
- If authenticated: keep using `supabase.functions.invoke()` as before

```typescript
if (isGuest) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const resp = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify(bodyPayload),
    signal: controller.signal,
  });
  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.error || `שגיאה ${resp.status}`);
  }
  data = await resp.json();
} else {
  const result = await supabase.functions.invoke("generate-story", { body: bodyPayload });
  data = result.data;
  apiError = result.error;
}
```

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — use raw `fetch()` for guest requests to avoid sending auth headers

