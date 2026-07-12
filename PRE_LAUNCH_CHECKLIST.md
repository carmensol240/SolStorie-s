# ✅ Pre-Launch Checklist — שינויי מחירים / חבילות / רכישות

צ'קליסט ידני שחובה לעבור עליו **לפני כל שינוי משמעותי** במחירים, חבילות, קישורי Grow, או בזרימת ה-webhook.
כל פריט = בדיקה אמיתית, לא רק "נראה בסדר בקוד".

---

## 1. תאימות מחירים UI ↔ Grow בפועל

- [ ] לכל `packageId` פעיל: המחיר המוצג ב-UI תואם למחיר שנגבה בפועל ב-Grow (לא רק ההערה בקוד).
  - נבדק ע"י פתיחת הקישור בפועל ולא ע"י קריאת comment ב-`src/config/grow-links.ts`.
  - חבילות פעילות: `basic`, `popular`, `singleStory`, `coloringSingle`, `coloringBundle`, `pdf` (+ `twoStories` כשיתוקן).
- [ ] `src/config/promo.ts` — `PROMO_PRICES` ו-`REGULAR_PRICES` מסונכרנים עם מה שבאמת מוגדר בלוח הבקרה של Grow.
- [ ] אם עדכנתי מחיר promo→regular ב-1/9/26 (או בכל תאריך אחר) — עדכנתי גם ב-Grow ידנית לפני שהתאריך עבר.

## 2. תקינות קישורי Grow

- [ ] כל ערך ב-`GROW_LINKS` (`src/config/grow-links.ts`) מתחיל ב-`https://pay.grow.link/` — **לא** `grow.website` ולא כל דומיין אחר.
  - יוצא דופן ידוע: `twoStories` שבור → חייב להישאר `comingSoon: true` ב-`src/config/gift-packages.ts` והכפתור מנוטרל ב-UI.
- [ ] כל `growKey` שמופיע ב-`GIFT_PACKAGES` פעיל קיים ב-`GROW_LINKS`.
- [ ] אין קישור פעיל שמפנה לדף מוצר של סוחר (`grow.website/products/...`) במקום לצ'קאאוט לקוח.

## 3. רכישת בדיקה אמיתית (test mode) — end-to-end

לפני כל שינוי גדול, לבצע רכישה אמיתית ולוודא זרימה מלאה:

- [ ] נכנסתי כמשתמש בדיקה (whitelist: `souldesign06@gmail.com`) והפעלתי כפתור "רכישת בדיקה" ב-`/upgrade`.
- [ ] ב-URL של Grow שנפתח מופיעים **בפועל**:
  - `cField1` = user id
  - `cField2` = packageId פנימי (`single_story_digital` / `popular` / ...)
  - `cField3` = story id (רק בתסריטים שמעבירים storyId)
- [ ] ה-`grow-webhook` קיבל את הקריאה (בדיקת edge function logs), עם `customFields` מלאים.
- [ ] הקרדיטים התווספו בפרופיל של המשתמש הנכון (ולא לפי amount fallback).
- [ ] `PurchaseSuccessModal` הופיע ב-UI אחרי חזרה מ-Grow (`GlobalPurchaseHandler` polling עובד).
- [ ] במקרה של כישלון תשלום — `PurchaseFailedModal` מופיע ומאפשר Retry שפותח את אותו קישור.

## 4. Webhook fallback (`packageIdFromAmount`)

- [ ] כל סכום שמופיע ב-`PROMO_PRICES` וב-`REGULAR_PRICES` ממופה ב-`packageIdFromAmount` (`supabase/functions/_shared/purchase-credits.ts`).
- [ ] התנגשות מוכרת: **59.90 ו-69.90 → `pdf`** (לא `gift_two_stories`). המשמעות: זרימת גיפט חייבת לשלוח `cField2` מפורש, אחרת הקרדיטים יוזרמו לחבילה הלא נכונה.
- [ ] סכומים לא מוכרים מחזירים `null` (לא נופלים בשקט לחבילה כלשהי).

## 5. חבילת הטסטים האוטומטית

- [ ] `bun test` רץ ומחזיר **ירוק לחלוטין** (17/17 ומעלה — מותר לגדול, אסור להתכווץ).
- [ ] אם הוספתי חבילה/מחיר/growKey — הוספתי גם טסט מתאים ב-`src/__tests__/purchase-flow.test.ts`.
- [ ] אם שיניתי מחיר promo/regular — עדכנתי את `EXPECTED_PROMO` / `EXPECTED_REGULAR` באותו קובץ טסטים.

## 6. עקביות UI ↔ Backend (אין הבטחות שקר)

- [ ] אין ב-UI (טקסט/פופאפ/badge) הבטחה שלא ממומשת ב-backend. דוגמאות בפועל שנתפסו בעבר:
  - "2 סיפורים חינם לאנשי חינוך" בזמן שה-trigger נותן 1.
  - "1+1 סיפור במתנה" אחרי סיום ה-promo (אמור להיעלם אוטומטית דרך `isPromoActive()`).
  - "החבילה כוללת PDF" בעוד `purchase-credits.ts` לא מזכה ב-`pdfDownload`.
- [ ] כל הטבה שמוצגת ב-UI מגובה בקוד ב-`supabase/functions/_shared/purchase-credits.ts` או ב-DB trigger `handle_new_user()`.
- [ ] בונוס 1+1: מותנה גם ב-`isPromoActive()` וגם ב-`first_purchase_bonus_given === false` — לא נכפל.

## 7. תאריכי promo ומחירים עתידיים

- [ ] `PROMO_END` ב-`src/config/promo.ts` וב-`supabase/functions/_shared/promo.ts` **זהים** לחלוטין (כולל אזור זמן).
- [ ] כרגע: `2026-08-31T23:59:59+03:00` (31/8/26 23:59 שעון ישראל).
- [ ] בלוק ה-TODO ב-`src/config/promo.ts` (עדכוני 1/9/26) מעודכן ותואם למחירים ב-`REGULAR_PRICES` ולמחירים בלוח Grow.
- [ ] תזכורת ביומן ל-30/8/26 לוודא שהמעבר promo→regular מוכן (גם ב-UI וגם בלוח Grow).

## 8. Sanity אחרון לפני deploy

- [ ] `bun test` ירוק.
- [ ] Build עובר בלי warnings חדשים על מחירים/חבילות.
- [ ] לא נשארו הפניות ל-PayPal בקוד (`rg -i paypal` נקי).
- [ ] `git diff` על `src/config/promo.ts`, `src/config/grow-links.ts`, `src/config/gift-packages.ts`, `supabase/functions/_shared/purchase-credits.ts` — נקרא ואושר ידנית.

---

_מיקום הקובץ: `PRE_LAUNCH_CHECKLIST.md` בשורש הפרויקט._