

## Plan: Add Two Upsell Packages Below Pricing Cards

### Layout Assessment
The upgrade page scrolls vertically — there is plenty of room. Two compact upsell cards placed side-by-side in a 2-column grid will fit well even on the 320px viewport. They replace the existing standalone edit kit card with a cleaner paired layout.

### Design
Two small glassmorphism cards in a `grid grid-cols-2 gap-3` row, placed after the "תשלום חד פעמי" line and before the coupon input:

```text
┌─────────────────┐ ┌─────────────────┐
│   🎨            │ │   ✏️            │
│ חבילת צביעה     │ │ חבילת עריכות    │
│ 5 דפי צביעה    │ │ 5 עריכות       │
│   ₪XX          │ │   ₪9.9         │
│  [ רכשו ]      │ │  [ רכשו ]      │
└─────────────────┘ └─────────────────┘
```

Each card: icon, title, short description, price, and a small CTA button. Same glass style as existing cards (`bg-white/10 backdrop-blur-md border border-white/15`).

### Changes

**`src/config/pricing.ts`**
- Add a `COLORING_KIT_PACKAGE` constant (id, pages count, price, label, badge)

**`src/pages/Upgrade.tsx`**
1. Replace the existing standalone Edit Kit card (lines 504-536) with a 2-column grid containing both upsell cards
2. Add state `showColoringKitPayPal` and its PayPal flow (similar to the existing edit kit flow)
3. Each card: compact design with emoji icon, title, one-line description, price, and small button
4. On purchase success for coloring kit: record purchase in `purchases` table (needs a coloring credits field or similar tracking)

### Open Question
The coloring feature is currently free. What does "חבילת צביעה" actually provide — 5 AI-generated coloring pages? Or something else? This affects what we track on purchase. We may need a `coloring_credits` column on profiles, or simply track it as a purchase record.

### Files modified
1. `src/config/pricing.ts` — add `COLORING_KIT_PACKAGE`
2. `src/pages/Upgrade.tsx` — replace edit kit section with 2-column upsell grid

