# Plan

## What I’ll change
1. Update the fixed bottom purchase CTA on `src/pages/GiftCard.tsx` so it uses the same stable bottom anchoring pattern as the working purchase flows instead of the current custom `bottom-[7.5rem]` placement.
2. Preserve the existing `handlePurchase` logic, auth redirect, validation, pricing, and payment panel behavior exactly as-is.
3. Verify in the preview on mobile that tapping the bottom CTA opens the payment section reliably and does not conflict with the bottom navigation.

## Why this is the smallest fix
- The purchase logic already works when the click lands.
- The problem appears to be mobile-specific interaction/layout around the fixed CTA, not the payment code.
- Matching the proven fixed-CTA pattern used elsewhere avoids changing any business logic.

## Technical details
- File: `src/pages/GiftCard.tsx`
- Focus area: the fixed CTA wrapper near the bottom of the page
- Expected adjustment: replace the custom fixed offset/stacking approach with a bottom-safe anchored container that remains tappable above mobile UI chrome
- No changes to:
  - `handlePurchase`
  - PayPal or Grow logic
  - package selection
  - form validation
  - any other page or component