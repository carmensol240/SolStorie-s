

## Plan: Ensure Coloring Feature Has No Credit Barriers

### Analysis
After thorough investigation of both the edge function (`generate-coloring-page/index.ts`) and the client code (`StoryViewer.tsx`):

- There is **no credit check** in the coloring feature — neither server-side nor client-side
- The edge function does not query any credits table or check user balances
- The client code does not check credits before calling the function

The only scenario where users could see a credits-related error is when the AI gateway returns HTTP 402 (platform-level billing, not user credits). The previous fix changed the message text but the edge function still returns `{ error: "...", retryable: true }` with `status: 200`, which the client treats as a failure because `!data?.image` is true.

### Root Cause
When the AI gateway returns 402 or 429, the edge function returns a 200 response with an error message but **no image**. The client then shows this error as a toast. The error path is correct behavior for a temporary service issue — but the user may be confusing this with a credits problem if an older deployed version is still running with the old "נגמרו הקרדיטים" message.

### Fix — Two Changes

1. **Redeploy the edge function** to ensure the latest code (with the corrected message) is live. The current source code already has the fix from the previous change.

2. **Add automatic retry on the client side** — when the response contains `retryable: true`, automatically retry the request after a short delay instead of showing an error toast. This prevents users from seeing any error for transient gateway issues.

### Changes

**`src/pages/StoryViewer.tsx`** (both print and online coloring click handlers):
- After receiving `data` from the edge function, check if `data?.retryable === true`
- If retryable, wait 5 seconds and retry the request once automatically
- Only show the error toast if the retry also fails
- This makes transient 402/429 errors invisible to users

**Redeploy**: `generate-coloring-page` edge function to ensure latest message text is live.

### Files modified
1. `src/pages/StoryViewer.tsx` — add client-side auto-retry for retryable coloring errors
2. Redeploy `generate-coloring-page` edge function

