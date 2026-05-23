## Goal
When user clicks "Package" in the paywall popup → goes to `/upgrade?firstStory={id}` → then clicks back / close ("X") on Upgrade, return to `/story/{storyId}` with the paywall popup re-opened, instead of `navigate(-1)` which dumps them to the home/previous page.

## Changes (scoped, popup/upgrade only)

### 1. `src/pages/Upgrade.tsx` — close button behavior
At line 349 the close (X) button currently does `navigate(-1)`. Replace with smart handler:
```ts
const handleClose = () => {
  if (firstStoryId) {
    navigate(`/story/${firstStoryId}?paywall=1`, { replace: true });
  } else {
    navigate(-1);
  }
};
```
Wire `onClick={handleClose}`. No other Upgrade behavior changes.

### 2. `src/pages/StoryViewer.tsx` — auto-reopen paywall on return
Add a small `useEffect` that reads `searchParams.get('paywall')`. If `=== '1'`:
- `setDemoLockOpen(true)`
- Remove the param from the URL (`navigate(location.pathname, { replace: true })`) so refresh doesn't keep reopening.

This restores the exact previous popup using the existing `demoLockOpen` state and existing `<DemoLockModal storyId={storyId} />`. The `pendingStoryReturn` sessionStorage (already saved by DemoLockModal before navigation) continues to govern which page the reader lands on.

### 3. No other files touched
- `DemoLockModal.tsx` — unchanged (already saves `pendingStoryReturn` and passes `storyId`).
- Package cards, PayPal flow, single-story flow — unchanged.
- Browser back button still works naturally (history entry exists).

## Why this works
- The user's mental model: "I opened a popup, I closed the upgrade page → I should be back at the popup". The `?paywall=1` round-trip makes that explicit and survives even hard refreshes of `/upgrade`.
- `replace: true` on the return keeps the history clean (no infinite back loop between Upgrade and StoryViewer).

## Out of scope
- Text/image mismatch in Gemini/fal prompts (deferred).
- Any change to the "package" or "single story" purchase actions themselves.
