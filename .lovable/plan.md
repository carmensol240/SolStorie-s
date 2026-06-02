## Problem

`openGrowCheckout` in `src/config/grow-links.ts` opens Grow with `window.open(url, "_blank")`. When the browser blocks the popup (common on mobile Safari, and universal inside in-app webviews like Instagram/Facebook/TikTok), `window.open` returns `null` and the code falls back to:

```js
window.location.href = url;
```

This navigates the user's app tab to Grow. When they close or hit "back" on the Grow screen, there is no app tab to return to — the app appears to "disappear".

## Fix

Change `openGrowCheckout` so we never replace the app tab. Two-tier strategy:

1. **Primary path — same tab, but the app remembers state and resumes on return.**
   Before navigating to Grow, save a small `pendingGrowCheckout` marker in `sessionStorage` (key, timestamp, current path, userId, storyId). Then navigate via `window.location.href = url`. When the user taps "back" from Grow, the browser restores the app tab to the same path, and an existing `OAuthReturnHandler`-style listener clears the marker and (optionally) triggers a purchase refresh.

   Actually simpler and safer: keep the new-tab behavior as the **primary** path on desktop, and on mobile (or whenever `window.open` returns null) do NOT fall back to `window.location.href`. Instead:

2. **Render a tiny "Continue to payment" intermediate screen** (a modal already controlled by the caller, or a dedicated `/checkout-redirect` route) with a real `<a href={growUrl} target="_blank" rel="noopener noreferrer">` link the user taps. A user-gesture click on an anchor is not blocked by popup blockers and works inside in-app webviews. If the user closes Grow, the app tab is still there underneath.

## Recommended implementation (minimal, low-risk)

Change `openGrowCheckout` to:

- Try `window.open(url, "_blank", "noopener,noreferrer")`.
- If it succeeds → done (current behavior, unchanged).
- If it returns `null` → **do not** call `window.location.href`. Instead:
  - Save `sessionStorage.setItem("grow:pendingUrl", url)`.
  - Return a sentinel (e.g. `{ blocked: true, url }`) so the caller can show a small "המשך לתשלום" button that is a real `<a target="_blank" href={url}>` the user clicks. This converts the programmatic open into a user-gesture open, which browsers allow.

Update the few call sites that today call `openGrowCheckout(...)` and immediately close their modal:
- `src/components/paywall/ColoringPurchaseModal.tsx`
- any other `openGrowCheckout(...)` callers (PackageCard, Upgrade page, PurchaseSummaryModal, etc.)

Pattern at each call site:

```ts
const res = openGrowCheckout(key, opts);
if (res?.blocked) {
  // show inline "המשך לתשלום" anchor instead of closing the modal
  setBlockedUrl(res.url);
  return;
}
onOpenChange(false);
```

The inline anchor:

```tsx
<a
  href={blockedUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  המשך לתשלום ✨
</a>
```

## Files to change

- `src/config/grow-links.ts` — change fallback behavior, return `{ blocked, url }` on popup-block.
- `src/components/paywall/ColoringPurchaseModal.tsx` — handle blocked result with inline anchor.
- `src/components/paywall/PurchaseSummaryModal.tsx` and other Grow callers — same pattern. I'll grep for `openGrowCheckout(` to find all sites during build mode.

## Out of scope

- No backend / webhook changes.
- No change to checkout URLs, pricing, or `cField*` parameters.
- No change to post-purchase verification flow.
