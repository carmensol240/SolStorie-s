

## Plan: Fix Story Generation Slowdown — Reduce Dispatch Wait

### Root Cause

The `generate-story` function waits up to **15 seconds** for background tasks (nikud, summary, illustrations, cover) before returning the response. From the logs:

- Story AI generation: **9s**
- Text rewrite: **2s**
- Dispatch wait: **15s** (hit the full timeout)

**Total: ~29s** — the 15s dispatch timeout accounts for half.

The problem: nikud (7 parallel AI calls) and summary (1 AI call) promises are bundled into the same `fetchPromises` array as illustration dispatches. The function waits for ALL of them. The nikud and summary are full AI calls that take 10-15s, which always hits the 15s timeout.

### Fix — `supabase/functions/generate-story/index.ts`

1. **Remove nikud and summary promises from the dispatch wait** (lines 1923-1924): Don't push `summaryPromise` and `nikudPromise` into `fetchPromises`. These should run truly in the background.

2. **Reduce dispatch timeout from 15s to 3s** (line 1992): The illustration and cover dispatches only need the HTTP connection to be accepted (~1-2s). Reduce to 3s.

3. **Keep nikud/summary running** by referencing them after the response dispatch so Deno doesn't garbage-collect them — add a separate `Promise.allSettled([nikudPromise, summaryPromise])` with no await (fire-and-forget).

### Expected Result
Response time drops from ~29s to ~14s (9s generation + 2s rewrite + 3s dispatch).

### Files modified
1. `supabase/functions/generate-story/index.ts` — unbundle nikud/summary from dispatch wait, reduce timeout

