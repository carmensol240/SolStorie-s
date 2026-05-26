## Goal
Add a short "purchase summary" confirmation screen that appears after the user clicks "Buy", BEFORE the payment is actually executed — so they can verify the package type, final price, and what's included to reduce mistaken purchases.

## Where it fits in the flow
Current flow (in `src/pages/Upgrade.tsx`):
1. User picks a tier card (digital / digital+printable) → tier card click immediately calls `handlePurchase()`
2. Bottom CTA button also calls `handlePurchase()` directly
3. `handlePurchase()` → either redirects to `/auth`, runs `handleTestPurchase`, or shows a "coming soon" toast

New flow:
1. User picks a tier card (no auto-purchase anymore)
2. User taps bottom CTA → opens a **Purchase Summary Modal** (not a new route)
3. In the modal: user reviews and taps "אישור ורכישה" to actually charge, or "חזרה" to cancel and pick again
4. Confirmation → existing `handlePurchase()` logic runs (auth redirect / test purchase / toast)

## What the summary modal shows
A compact card, in Hebrew, RTL, matching the magical dark theme of the Upgrade page:

- Header: "סיכום הרכישה 🌿"
- **חבילה**: tier label (e.g. "דיגיטלי + מודפס")
- **מה כלול**: bullet list of `tier.features` that are `included: true` (for the digital tier we already filter; for the full tier show the included list)
- **קופון**: if `appliedCouponCode` is set, show `code` + `-X%`
- **מחיר**:
  - If discount applied: original price (line-through) + discounted price
  - Else: original price only
- Small note: "📚 הסיפור נשמר בספרייה החינמית שלך לכל החיים"
- Buttons:
  - Primary: "אישור ורכישה ₪{finalPrice} ✨" (gradient, same style as current CTA)
  - Secondary: "חזרה" (ghost) → closes modal, returns to selection

## Files to change
- `src/pages/Upgrade.tsx`
  - Add `const [showSummary, setShowSummary] = useState(false);`
  - Tier card `onClick` → only `setSelectedTier(tier.id)` (remove the `setTimeout(handlePurchase)`)
  - Bottom CTA `onClick` → `setShowSummary(true)` instead of `handlePurchase`
  - Pass `selectedTierData`, `discountPercent`, `discountedPrice`, `appliedCouponCode`, and an `onConfirm` callback (which calls existing `handlePurchase`) to the new modal
  - Track analytics event `purchase_summary_viewed` when the modal opens

- New file `src/components/paywall/PurchaseSummaryModal.tsx`
  - Built on shadcn `Dialog` (already used elsewhere in the project)
  - Receives: `open`, `onOpenChange`, `tier`, `originalPrice`, `finalPrice`, `discountPercent`, `couponCode`, `onConfirm`
  - Renders the layout described above

## Out of scope
- No changes to actual payment processing, `verify-purchase`, or first-purchase-bonus logic
- No changes to copy of the existing tier cards
- No changes to coupon validation
- No route changes — the summary is a modal, not a separate `/checkout` page
