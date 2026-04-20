

## Update 15-story price + emphasize one-time-payment text

### Changes (two files only)

**1. `src/config/pricing.ts`** — Update the `premium` package:
- `price: 139` → `price: 119`
- `originalPrice: 139` → `originalPrice: 119`
- `pricePerStory: "9.3₪"` → `pricePerStory: "7.9₪"` (119 ÷ 15 ≈ 7.93)

This automatically updates the price wherever the premium package is rendered (Upgrade page, paywall, PayPal amount sent to `verify-purchase`).

**2. `src/pages/Upgrade.tsx`** — Locate the "תשלום חד פעמי - הקרדיטים שלך לא פגים - אין מינוי" line and increase its visual weight:
- Bump font size up one step (e.g. `text-xs` → `text-sm`, or `text-sm` → `text-base`)
- Add `font-bold` (or upgrade existing weight)
- Keep exact same location, color, container, and surrounding elements

### What will NOT change
- No layout, spacing, colors, gradients, or fonts elsewhere.
- No changes to the basic (₪39) or popular (₪99) packages.
- No changes to badges, edits count, coloring pages count, or any other package metadata.
- No changes to `EDIT_KIT_PACKAGE`, `COLORING_KIT_PACKAGE`, `EDUCATOR_PACKAGE`, or `TOOLKIT_SUBSCRIPTION`.
- PayPal flow, verify-purchase, and credit-granting logic untouched (the new ₪119 amount flows through automatically since pricing is read from the config).

### Note on memory
The memory `mem://features/billing/full-price-policy` records the old prices (39 / 99 / 139). After this change I'll update it to reflect the new premium price of 119.

### How to revert
- Restore `price: 139`, `originalPrice: 139`, `pricePerStory: "9.3₪"` in `src/config/pricing.ts`.
- Revert the font-size/weight class on the one-time-payment line in `Upgrade.tsx`.

