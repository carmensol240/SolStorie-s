## Goal

Replace the gift packages on `/gift` with exactly three options (in one row):
1. **Single Digital** — 39.90₪ — 1 story
2. **Single Full** — 99.90₪ — 1 story (marked as popular)
3. **2 Stories Gift** — 79.90₪ — 2 stories

Remove the 6-story and 10-story packages entirely. Keep everything else on the page (hero, "how it works", name fields, PayPal/Grow buttons, success screen, copy) unchanged.

## Changes

### `src/pages/GiftCard.tsx`
- Replace the `GIFT_PACKAGES` definition. Stop importing `PRICING_PACKAGES`; define a local array with three entries:
  - `{ id: "gift_single_digital", stories: 1, price: 39.90, label: "סיפור בודד", subtitle: "דיגיטלי", badge: undefined, growKey: "basic" }`
  - `{ id: "gift_single_full", stories: 1, price: 99.90, label: "סיפור בודד", subtitle: "חוויה מלאה", badge: "הכי פופולרי 🔥", growKey: "popular" }`
  - `{ id: "gift_two_stories", stories: 2, price: 79.90, label: "2 סיפורים במתנה", subtitle: "חבילה זוגית", badge: undefined, growKey: null }` (no Grow link yet — Grow button hidden/disabled for this option, PayPal still works)
- Default `selectedPackage` becomes `"gift_single_full"` (the popular one).
- Card grid: keep `grid-cols-3`. Since each card now represents 1 or 2 stories, adjust the visible card content so it doesn't read awkwardly:
  - Show `pkg.label` as the title row.
  - Show price `₪{pkg.price.toFixed(2)}`.
  - Show `pkg.subtitle` underneath instead of "X לסיפור".
  - Keep the Gift icon and the badge ribbon.
- Update `handleGrowPurchase` to use `selectedPkg.growKey` instead of `selectedPkg.id`. If `growKey` is null, show a toast ("התשלום באשראי לחבילה זו יתווסף בקרוב — אפשר להשלים ב-PayPal") and return. PayPal flow remains unchanged and uses `selectedPkg.stories` + `selectedPkg.price` (already generic).
- WhatsApp share message currently reads `חבילת ${selectedPkg.stories} סיפורים` — leave the template as-is; for `stories: 1` it will read "חבילת 1 סיפורים". Acceptable for now, or quick fix: branch on `stories === 1 ? "סיפור אישי אחד" : "${stories} סיפורים אישיים"`. Will apply the small branch for cleaner Hebrew.

### No other files changed
- `src/config/pricing.ts` stays untouched (still used by `/upgrade` and elsewhere).
- `src/config/grow-links.ts` stays untouched; we reuse existing `basic` and `popular` keys for the two single-story variants. The 79.90 Grow link will be added later.
- Backend (`create-gift-coupon`, `grow-webhook`) accepts the package id + stories/price from the client, so the new ids work without server changes for the PayPal path. The Grow path for the new ids isn't wired anyway (only `gift_two_stories` lacks a link, and the two single variants reuse existing webhook-known keys `basic`/`popular`).

## Out of scope
- No design overhaul of the page.
- No changes to success screen, hero, copy, or "how it works".
- No backend / webhook changes.