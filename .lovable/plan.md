## Goal
Remove the "לתשלום ב-PayPal" link from the coloring purchase modal, and any other user-visible PayPal text still showing in the app. PayPal flows are gone; checkout uses Grow.

## Changes

### 1. `src/components/paywall/ColoringPurchaseModal.tsx`
- Remove the `<button onClick={() => setShowPaypal(true)}>לתשלום ב-PayPal</button>` (the link under the main CTA).
- Remove the entire `showPaypal` branch (the PayPal payment view with `PayPalButton`, verify flow UI, and "חזרה" button) since it's no longer reachable.
- Remove the now-unused `showPaypal` state, `setShowPaypal` calls in `handleClose` and `handlePayPalSuccess`, the `PayPalButton` import, and the `handlePayPalSuccess` handler if it becomes orphaned. Keep Grow checkout path intact (`handleGrowCheckout`, main CTA, "אולי בפעם אחרת").

### 2. `src/pages/Onboarding.tsx` (lines 278–284)
- Remove the "PayPal Notice" block: `💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל`. Misleading now that PayPal is gone.

### 3. `src/components/shared/AboutSolStoriesContent.tsx` (line 28)
- Remove the line `💳 תשלום נוח באשראי: ניתן לשלם בכרטיס אשראי ישירות, ללא צורך בחשבון PayPal.` (or rewrite to just "תשלום נוח באשראי" without the PayPal mention). Preferred: drop the PayPal phrasing, keep `💳 תשלום נוח באשראי ישירות.`

### Not changed
- `src/pages/Toolkit.tsx`: only internal variable names (`showPayPal`) and a no-op `{!showPayPal && …}` guard — no visible "PayPal" text to the user. Leave as-is (out of scope: behavior change).
- `src/pages/GiftCard.tsx`: only an internal code comment.
- `src/config/grow-links.ts`, `src/components/paywall/PayPalButton.tsx`: not user-visible strings; leaving the button component file untouched (still imported elsewhere if any). No behavior changes requested.

## Verification
- Open coloring purchase modal → confirm no "לתשלום ב-PayPal" link, Grow CTA still works.
- Open onboarding final step → no PayPal notice.
- Open About content → no PayPal mention.
