

## Plan: Add Polling Fallback for Story Ready Detection

### Problem
The current implementation relies on Supabase realtime subscription to detect when illustrations are done. If realtime doesn't fire (connection issues, RLS filtering), the loading screen stays stuck until the 180s safety timeout. There's also no polling during the `illustrations` phase.

### Fix — `src/components/wizard/GeneratingStep.tsx`

**Add a 3-second polling interval** inside the existing `illustrations` phase useEffect (lines 326-404). This supplements the realtime subscription as a reliable fallback.

After `checkIllustrations()` is called initially (line 372) and the realtime channel is set up (line 389), add:

```typescript
// Poll every 3 seconds as fallback for realtime
const pollInterval = setInterval(() => {
  checkIllustrations();
}, 3000);
```

Clean it up in the return function alongside the channel cleanup.

**Update progress based on illustration count**: Inside `checkIllustrations`, when pages are fetched but not all have illustrations yet, calculate partial progress:

```typescript
if (pages && pages.length > 0) {
  const done = pages.filter(p => p.illustration_url).length;
  const total = pages.length;
  const illustrationProgress = 50 + (done / total) * 45; // 50-95 range
  setProgress(Math.max(progress, illustrationProgress));
}
```

**Also auto-navigate on `showReadyPopup`**: The safety timeout sets `showReadyPopup` but doesn't trigger navigation. Add a small effect or inline the navigation call so that when `showReadyPopup` becomes true, it auto-navigates after 1.5s (same as the ready flow).

### Summary of changes
1. Add `setInterval` polling every 3s alongside the existing realtime channel
2. Update progress bar based on illustration completion count
3. Ensure safety timeout also triggers auto-navigation

### Files modified
1. `src/components/wizard/GeneratingStep.tsx` — add polling interval, progress updates, auto-navigate on timeout

