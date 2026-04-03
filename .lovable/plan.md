

## Analysis: Story Generation Failure for Unauthenticated Users

### Root Cause
The edge function logs show **402 — "Not enough credits"** from the Lovable AI Gateway. This is a platform-level credit issue that affects ALL users (not just unauthenticated ones). The guest mode flow is correctly implemented:

- Edge function already supports `guestMode: true` (line 588-608)
- JWT verification is disabled in config.toml
- The signup form renders correctly for unauthenticated users
- The "אולי אחר כך" dismiss flow triggers generation with `guestMode: true`

The error message "לא הצלחנו ליצור את הסיפור הפעם" appears because the 402 from the AI gateway returns "שגיאת הרשאה" which gets caught by the generic error handler.

### The Fix — Two Issues

**1. Better error message for 402 (AI credits)**: The edge function currently lumps 401 and 402 together as "שגיאת הרשאה" (line 1468). This is misleading — a 402 means the platform ran out of AI credits, not a user auth issue. Separate these cases.

**2. Prevent stale auth token from failing guest requests**: When `supabase.functions.invoke()` is called by an unauthenticated user, the Supabase client may still send a stale/expired JWT from a previous session. The edge function sees no `guestMode` flag issue, but the stale token could cause the auth check to fail before reaching guest mode logic. Add defensive handling: if `guestMode: true`, skip auth validation entirely regardless of any Authorization header present.

### Changes — `supabase/functions/generate-story/index.ts`

1. **Move guestMode check first** (lines 598-631): Check `guestMode` before checking auth header. Currently the order is correct, but ensure `guestMode` takes priority even if an Authorization header is present (stale token scenario).

2. **Separate 401 from 402 error messages** (line 1468): Return "שגיאת מערכת זמנית. נסו שוב מאוחר יותר." for 402, and keep "שגיאת הרשאה" only for 401.

### Changes — `src/components/wizard/GeneratingStep.tsx`

3. **Improve error handling** for the 402 case: Instead of showing "לא הצלחנו ליצור את הסיפור הפעם" for all errors, detect the "שגיאת מערכת" message and show a more helpful retry message.

### Files modified
1. `supabase/functions/generate-story/index.ts` — separate 401/402 handling, ensure guestMode bypasses stale tokens
2. `src/components/wizard/GeneratingStep.tsx` — better error display for system errors

