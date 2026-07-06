# עדכון תאריך סיום מבצע ל-31.8.2026 + כיבוי אוטומטי של המחיר והבונוס

## המצב היום

- תאריך הסיום מקודד ב-`src/pages/Upgrade.tsx` שורה 74: `LAUNCH_DEADLINE = "2026-07-12T23:59:59"`.
- בנוסף מופיע הטקסט "אחרי 12/7" ב-`Upgrade.tsx` (שורה 366) וב-`GiftCard.tsx` (שורה 403).
- בונוס ה-1+1: מוענק ב-`supabase/functions/_shared/purchase-credits.ts` (בלוק `firstPurchaseBonus`), ומוצג ב-UI ב-`src/components/story/DemoLockModal.tsx` (טקסטים "🎁 סיפור ראשון? מגיע לך מתנה", "+ סיפור דיגיטלי נוסף במתנה 🎁").
- **אין** כרגע לוגיקה גורפת של "פגות מבצע" — הכל מקודד קבוע. יש להוסיף אותה.

## מה יבוצע

### 1. קובץ תאריך משותף (חדש) — `src/config/promo.ts`
```ts
export const PROMO_END = new Date("2026-08-31T23:59:59+03:00");
export const isPromoActive = (now: Date = new Date()) => now < PROMO_END;
export const PROMO_END_LABEL = "31/8"; // לטקסטים ב-UI
```

### 2. `src/pages/Upgrade.tsx`
- להחליף את `LAUNCH_DEADLINE` ב-`PROMO_END` מהקובץ המשותף.
- להחליף את הטקסט "אחרי 12/7 המחירים יעלו" ב-"אחרי 31/8 המחירים יעלו".
- להוסיף `const promoActive = isPromoActive();`.
- כשהמבצע לא פעיל:
  - להסתיר את בלוק הקאונטדאון לגמרי.
  - להשתמש ב-`product.originalPrice` כמחיר היחיד המוצג (בלי strikethrough, בלי תגית "🔥 מחיר השקה", בלי "חסכו ₪X").
  - לעדכן את `selectedBasePrice` להשתמש ב-`originalPrice` כשהמבצע לא פעיל, כך שגם ה-checkout יעבוד עם המחיר החדש.

### 3. `src/pages/GiftCard.tsx`
- לייבא `isPromoActive` + `PROMO_END_LABEL`.
- להחליף "אחרי 12/7" ב-"אחרי 31/8".
- כשהמבצע לא פעיל: להסתיר את התגית "🔥 מחיר השקה", את ה-strikethrough על `originalPrice`, ואת הטקסט "אחרי X/X המחיר עולה". להציג רק את `price` — אבל להחליף את המקור: המחיר המוצג יהיה `originalPrice` (39.90 / 79.90 / 119.90). לעדכן גם את קריאת ה-checkout שתשלח את המחיר הנכון.

### 4. `src/components/story/DemoLockModal.tsx`
- לייבא `isPromoActive`.
- להחליף את התנאי `isFirstTimeBuyer && promoActive` להצגת:
  - "🎁 סיפור ראשון? מגיע לך מתנה!" (שורה 95)
  - "רכשו ב-39.90 ₪ וקבלו סיפור דיגיטלי נוסף" (שורה 98)
  - "+ סיפור דיגיטלי נוסף במתנה 🎁" (שורה 118)
- כשהמבצע לא פעיל — שלושתם לא מוצגים, ומחיר הכפתור מתעדכן ל-39.90 ₪ (מחיר מקורי).

### 5. גיבוי בצד השרת — קובץ משותף חדש `supabase/functions/_shared/promo.ts`
```ts
export const PROMO_END = new Date("2026-08-31T23:59:59+03:00");
export const isPromoActive = () => new Date() < PROMO_END;
```
ב-`supabase/functions/_shared/purchase-credits.ts`, בבלוק `if (config.firstPurchaseBonus)` להוסיף `&& isPromoActive()` — כך שגם אם קליינט מיושן ינסה לקבל בונוס אחרי 1.9, השרת לא יעניק אותו.

## מה לא משתנה

- מבנה המוצרים, ה-Grow checkout links, הבדיקות של `first_purchase_bonus_given`, ולוגיקת ה-test purchase.
- החל מ-1.9.2026 בבוקר, כל הלקוחות יראו אוטומטית את המחיר המקורי בלבד, בלי countdown, בלי בונוס — ללא צורך בהתערבות ידנית.
