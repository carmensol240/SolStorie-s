

## Bug Analysis

The illustration generation is failing silently because of two interrelated issues:

### 1. Fire-and-Forget Fetches Are Abandoned by Deno Runtime

In `generate-story/index.ts` (lines 1345-1374), the function dispatches `fetch()` calls to `generate-illustrations` without `await` — they're true fire-and-forget. **However, Deno Edge Functions terminate the runtime shortly after the Response is returned** (line 1405). The fetch promises and their `.then()` handlers are never resolved because the process exits.

This explains why there are **zero logs** for `generate-illustrations` despite the function being reachable — the calls are simply never executed.

### 2. Sequential Processing with Excessive Retries

Even if the calls did reach `generate-illustrations`, each invocation (one per page) processes sequentially with 3 retries × 60s timeout (Instant Character) = up to 180s for a single page, exceeding the ~150s Edge Function timeout.

### Evidence

- Latest story `d004a51d` (created ~20min ago): status stuck at `generating_illustrations`, all 4 illustration pages have `null` URLs.
- Zero logs for `generate-illustrations` or `generate-cover` — they were never called.
- Direct curl to `generate-illustrations` works fine (returns 500 for test data, as expected).

---

## Fix Plan

### 1. `generate-story/index.ts` — Await the fire-and-forget fetches before returning

The fetch calls to `generate-illustrations` and `generate-cover` must complete (or at least be dispatched and their TCP connection established) before the function returns. Use `Promise.allSettled()` to fire all illustration calls in parallel and wait for them to actually be sent, not for their full completion.

**Alternative (simpler):** Use `waitUntil`-style pattern — but since Deno edge functions don't support `waitUntil`, the fix is to **await the fetch calls** themselves. Since we're already using distributed single-page calls, each fetch just needs to establish the connection (~1-2s), not wait for the full illustration generation.

However, the real problem is more subtle: `fetch()` in Deno edge functions as fire-and-forget won't survive the response return. The fix is to:

1. Collect all fetch promises into an array
2. `await Promise.allSettled(fetchPromises)` — this ensures Deno actually sends the HTTP requests
3. Only then return the response

This won't block for illustration completion because `generate-illustrations` will return quickly (it processes in the background on its own runtime instance). The key is that the **HTTP request itself must be sent** before `generate-story` returns.

### 2. `generate-illustrations/index.ts` — Reduce retry count for Instant Character

Reduce `MAX_RETRIES` from 3 to 2 for the main loop (line 695), and keep the `AbortSignal.timeout(60_000)` for Instant Character. This ensures a single-page invocation stays under 150s even in worst case: 2 × 60s + overhead = ~125s.

### 3. Fix stuck story

After deploying the fix, update the stuck story to `failed` status so the user can retry, or trigger illustration generation manually.

### Files to Edit
- `supabase/functions/generate-story/index.ts` — Lines 1345-1400: collect fetch promises and await them
- `supabase/functions/generate-illustrations/index.ts` — Line 695: reduce MAX_RETRIES to 2

