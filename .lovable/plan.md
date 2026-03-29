

## Plan: Fix Post-Generation Navigation Bug

### Root Cause Analysis

Two issues found in `GeneratingStep.tsx` that can cause broken navigation after story generation:

**Bug 1 — Multiple `onComplete` calls (no guard):** The `checkIllustrations` function is called both immediately and on every realtime UPDATE event. When `generation_status === 'ready'`, each call queues `onComplete(storyId)` inside a `setTimeout`. Multiple realtime events can trigger multiple overlapping `onComplete` calls, each running the async slug-lookup loop in `handleStoryGenerated` simultaneously, causing race conditions.

**Bug 2 — `onComplete` in `generateStory` deps (unnecessary):** `onComplete` is listed in `generateStory`'s dependency array (line 255) but is never used inside the function. This causes `generateStory` to be needlessly recreated if `onComplete` ever changes identity, which cascades to the main effect (line 332-400) being torn down and re-created.

### Changes — 2 files

**`src/components/wizard/GeneratingStep.tsx`:**
1. Add a `hasNavigatedRef = useRef(false)` guard near other refs.
2. In `checkIllustrations`, check `hasNavigatedRef.current` before calling `onComplete`. Set it to `true` before calling.
3. In `handleOpenStory`, also check and set `hasNavigatedRef.current`.
4. Remove `onComplete` from `generateStory`'s dependency array.
5. Reset `hasNavigatedRef.current = false` in `handleRetry`.

**`src/pages/CreateStory.tsx`:** No changes needed — the `stableOnComplete` pattern is correct.

### What stays the same
All other logic: generation, retry, progress bar, realtime subscription, puzzle timeout, CreateStory navigation — untouched.

