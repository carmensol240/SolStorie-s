// Promo end: 31/8/2026 23:59 Israel time (UTC+3).
// After this moment: countdown hidden, launch prices revert to originalPrice,
// and the 1+1 first-purchase bonus is disabled everywhere in the UI.
export const PROMO_END = new Date("2026-08-31T23:59:59+03:00");
export const PROMO_END_LABEL = "31/8";
export const isPromoActive = (now: Date = new Date()): boolean =>
  now.getTime() < PROMO_END.getTime();

// ─────────────────────────────────────────────────────────────────────────────
// TODO 1/9/26 — עדכון מחירים ידני (לבצע ביום עצמו, לא אוטומטי):
//
// שינויי מחיר:
//   • PDF:                              59.90  →  69.90
//     - src/components/story/PrintPdfOfferModal.tsx (טקסט "59.90 ₪ בלבד")
//     - src/config/grow-links.ts        (GROW_LINKS.pdf + packageIdFromAmount)
//   • חבילת דיגיטלי (basic):            29.90  →  39.90
//     - src/pages/Upgrade.tsx           (מוצר single_story_digital)
//     - src/config/grow-links.ts        (GROW_LINKS.single_story + packageIdFromAmount)
//   • הכי פופולרי (popular):            99.90  → 119.90
//     - src/pages/Upgrade.tsx           (מוצר popular)
//     - src/components/story/DemoLockModal.tsx (כפתור "החבילה הפופולרית")
//     - src/config/grow-links.ts        (GROW_LINKS.popular + packageIdFromAmount)
//   • גיפטקארד — 2 סיפורים דיגיטליים:   59.90  →  69.90
//     - src/pages/GiftCard.tsx          (מוצר gift_two_stories)
//     - src/config/grow-links.ts        (GROW_LINKS.gift_two_stories + packageIdFromAmount)
//   • סיפור דיגיטלי בודד: מחיר קבוע 39.90 (ראה שינוי בפופאפ למטה)
//     - src/components/story/DemoLockModal.tsx (כפתור "רכישת הסיפור הדיגיטלי")
//
// שינוי נוסף (לא מחיר) — הפופאפ באמצע קריאת הסיפור:
//   קובץ:     src/components/story/DemoLockModal.tsx
//   מיקום:    בלוק `showBonusOffer` — שורות ~97-106 (טקסט 1+1 בכותרת)
//             ובלוק תת-הכפתור — שורות ~123-127 ("+ סיפור דיגיטלי נוסף במתנה 🎁")
//   מקור הדגל: `showBonusOffer` מחושב מ-`isPromoActive() && isFirstTimeBuyer`
//             (שורות ~40-55 באותו קובץ).
//   פעולה ב-1/9: להסיר לחלוטין את הבטחת "סיפור חינם" — להשאיר רק את כפתור
//             הרכישה הרגיל ב-39.90 ₪ ללא כותרת המתנה וללא שורת הבונוס.
//             ניתן פשוט להסיר את בלוקי `showBonusOffer` (או להעביר את הדגל
//             ל-`false` קבוע), כי `isPromoActive()` כבר יחזיר `false` אחרי
//             31/8/26 23:59 — כך שהפופאפ יתנקה אוטומטית ברגע ש-`PROMO_END`
//             יעבור, ואין חובה לגעת בקוד הפופאפ ידנית אלא רק אם רוצים לנקות
//             את הענף המת.
//
// תזכורת: לסמן ביומן 30/8/26 — לוודא שה-TODO הזה בוצע לפני 1/9.
// ─────────────────────────────────────────────────────────────────────────────