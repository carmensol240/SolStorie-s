Update `src/components/story/DemoLockModal.tsx` only.

1. **Digital plan button** (`goSingleStory`): Below the price line "רכישת הסיפור הדיגיטלי 📱 – 49.90₪", add a small second line: `+ סיפור דיגיטלי נוסף במתנה 🎁`.
   - Shown only for first-time buyers. Detect via existing credits/purchase signal — check `useCredits` / purchase history hook to gate the line. If no straightforward signal exists in this component, I'll reuse the same logic already used elsewhere for "first purchase bonus" (e.g. the `grant-first-purchase-bonus` flow / `FirstPurchaseBonusModal` trigger).
   - Styling: small text, white/80, font-bold, tight spacing under main label.

2. **Popular plan button** (`goPopular`): Below the existing subtitle "קריאה מלאה + שיתוף בוואטסאפ + הקלטת קול", add a compact line: `+ חבילת דפי צביעה מלאה 🎨`.
   - Same `text-[11px]` size, kept on one line for 320px mobile width.

No other text, layout, pricing, or logic changes.