## Price updates

Apply the new prices everywhere they appear in the UI and in server-side amount maps used for purchase identification. Coloring page prices stay unchanged.

| Item | Old | New |
|---|---|---|
| Digital story (single) | 39.90 ₪ | 49.90 ₪ |
| Printable PDF add-on | 59.90 ₪ | 69.90 ₪ |
| 2 digital stories (gift) | 79.90 ₪ | 89.90 ₪ |
| Popular / Full package | 99.90 ₪ | 119.90 ₪ |

## Files to update

**Frontend (display + logic constants):**
- `src/pages/Upgrade.tsx` — `TIERS.digital.price` 39.90→49.90; `TIERS.full.price` 99.90→119.90; hardcoded "99.90" strings in card and CTA → "119.90"; `selectedBasePrice` ternary updated.
- `src/components/paywall/PurchaseSummaryModal.tsx` — three hardcoded "99.90" strings → "119.90".
- `src/pages/GiftCard.tsx` — three package prices: 39.90→49.90, 99.90→119.90, 79.90→89.90.
- `src/components/story/DemoLockModal.tsx` — first-story popup texts: "39.90 ₪" → "49.90 ₪" (line 70 + line 87); "99.90₪" → "119.90₪" (line 107).
- `src/pages/StoryViewer.tsx` line 2172 — first-story gift popup description: "39.90 ₪" → "49.90 ₪".
- `src/components/story/PrintPdfOfferModal.tsx` line 53 — "59.90 ₪" → "69.90 ₪".
- `src/config/grow-links.ts` — update price comments only (links themselves untouched).

**Popular plan savings label (Upgrade.tsx, popular tier card):**
Add a small badge under the price on the `full` tier card showing:
`במקום ₪144 · חסכו ₪25`
Styled subtly (e.g. white/70 text, line-through on 144) to fit the existing card without disturbing layout.

**Backend amount maps (so post-purchase credit grant still resolves the package):**
- `supabase/functions/_shared/purchase-credits.ts` `packageIdFromAmount`: add `a === 49.9 → "single_story_digital"`, `a === 119.9 → "popular"`, `a === 69.9 → "pdf"`. Keep the old 39.9 / 99.9 / 59.9 entries so historical/in-flight orders still resolve.
- `supabase/functions/paypal-webhook/index.ts` amount map: add entries for 49.9 (basic/single digital), 69.9 (pdf), 119.9 (popular). Keep existing 39 / 59 / 79.9 / 99 rows intact.

## Explicitly NOT changed
- Coloring page pricing (9.90, 24.90) — untouched.
- Multi-story / educator packages in `src/config/pricing.ts` (79 / 199 / 279 etc.) — these are different packages than the single-story prices above and aren't called out in the request.
- Grow checkout link URLs, PayPal client IDs, button labels, layout, colors.
- The `TIERS.full.label` ("הכי פופולרי 🔥") stays as-is.

## Notes
- `verify-purchase` already validates with a ±1 ₪ tolerance and the per-call `amount` comes from the client/grow flow, so no edits needed there.
- 144 = 49.90 + 69.90 + 24.90 (digital + PDF + coloring), savings vs. 119.90 ≈ 25 ₪ — matches the requested copy.
