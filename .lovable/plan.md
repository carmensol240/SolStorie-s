## Problem

On `/gift`, the fixed purchase CTA (`src/pages/GiftCard.tsx`, the bottom "רכשו … סיפורים במתנה" button) does not respond to clicks.

Root cause: `src/components/pwa/PWAInstallBanner.tsx` renders globally with **exactly the same position** as the gift CTA — `fixed bottom-[4.5rem] left-0 right-0` — and uses `z-[9999]`, while the gift CTA wrapper only has `z-20`. When the PWA banner is visible (the common case for any user who hasn't dismissed it / installed the app), it sits directly on top of the CTA and swallows every click. That matches the session replay: repeated clicks at ~(624, 705) with no state change.

Other fixed-bottom UI (`MobileNavigation`, `h-14` at `bottom-0`, `z-[100]`) does not overlap the CTA — only the PWA banner does.

## Fix (scope: GiftCard CTA only)

In `src/pages/GiftCard.tsx`, in the `{!showPayPal && (...)}` fixed CTA wrapper near the bottom of the file:

1. Move the CTA above the PWA banner so they no longer occupy the same row: change `bottom-[4.5rem]` → `bottom-[7.5rem]` (the banner is ~2.75rem tall sitting at `bottom-[4.5rem]`, so 7.5rem clears it with a small visual gap; when the banner is dismissed the CTA simply sits a bit higher above the mobile nav, which is acceptable).
2. Raise its stacking context above the banner: change `z-20` → `z-[10000]`, so even if a future banner change overlaps it again, the CTA still receives pointer events.
3. Bump the scroll container's bottom padding so the last content isn't hidden under the now-higher CTA: change `pb-32` on the scroll wrapper (`flex-1 overflow-y-auto pb-32 ...`) → `pb-40`.

No changes to:
- The button's `onClick` / `disabled` logic, handlers, or any business logic.
- The PWA banner itself (it remains globally available and unchanged).
- `MobileNavigation`, PayPal flow, Grow flow, success screen, or any copy.

## Verification

After the change, on `/gift`:
- With the PWA install banner visible, the CTA sits just above it and clicks reach `handlePurchase` (navigates to `/auth` if logged out, otherwise opens the PayPal/Grow section).
- With the banner dismissed, the CTA is still tappable above the bottom nav with no visual overlap.
