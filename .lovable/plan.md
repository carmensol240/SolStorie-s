

# Image Generation Hardening + Verification of Existing Fixes

## Status of Requested Items

| Request | Status |
|---------|--------|
| WhatsApp sharing (wa.me deep-link) | Already done |
| Dynamic OG tags (child name, topic) | Already done |
| cover_url normalization | Already done |
| Ben/Sol sibling rule ("אחיה הקטן") | Already done |
| Meir Shalev style, no rhymes | Already in prompt |
| Character reference images (Sol, Ben, Zoe, Leo, Mia) | Already done |
| **Fetch timeout on AI calls** | **Missing - will fix** |
| **Auto-retry in retry-illustration** | **Missing - will fix** |
| **Auto-retry in generate-cover** | **Missing - will fix** |

## What Will Change

### 1. `supabase/functions/generate-illustrations/index.ts` -- Add 120s fetch timeout

The `generateIllustration` function calls `fetch()` without an `AbortController` timeout. If the AI gateway hangs, the edge function will time out silently with no retry.

Add a 120-second `AbortSignal.timeout()` to the fetch call (line 278):

```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  signal: AbortSignal.timeout(120_000), // 2 min timeout
  headers: { ... },
  body: JSON.stringify(requestBody),
});
```

This ensures a hung request fails fast enough for the retry loop (3 attempts) to kick in.

### 2. `supabase/functions/retry-illustration/index.ts` -- Add timeout + auto-retry

Currently this function makes a single fetch call with no timeout or retry. Will add:
- 120-second `AbortSignal.timeout()`
- 2-attempt retry loop with 3-second delay between attempts
- Proper error logging per attempt

### 3. `supabase/functions/generate-cover/index.ts` -- Add timeout + auto-retry

Same pattern: currently no timeout, no retry. Will add:
- 120-second `AbortSignal.timeout()`
- 2-attempt retry loop with 3-second delay
- Keep existing error handling for upload failures

### 4. Deploy all 3 edge functions

All three functions will be redeployed after changes.

## Technical Details

The `AbortSignal.timeout()` API is supported natively in Deno (used by edge functions). It creates a signal that automatically aborts after the specified milliseconds, causing the fetch to throw an `AbortError` which is caught by the existing try/catch blocks.

The retry pattern:
```text
Attempt 1 --> timeout/fail --> wait 3s --> Attempt 2 --> timeout/fail --> return error
```

For generate-illustrations, the existing 3-attempt retry loop already handles this -- the timeout just ensures each attempt fails cleanly instead of hanging.

## Files Unchanged
- `src/pages/StoryViewer.tsx` -- WhatsApp sharing already fixed
- `supabase/functions/og-story-meta/index.ts` -- Dynamic OG tags already fixed
- `supabase/functions/generate-story/index.ts` -- Sibling rule already correct
- All frontend components -- no changes needed

