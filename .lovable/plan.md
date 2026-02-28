

## בדיקת תקינות וייצוב זרימת התשלום

### מצב נוכחי — ממצאים

1. **Client ID** — משתמש ב-Live Client ID (`AffM7iJE3...`) מ-`src/config/pricing.ts`. תקין.
2. **Guest Checkout** — הודעת "ניתן לשלם בכרטיס אשראי ללא חשבון PayPal" מופיעה ב-3 מקומות (שורות 477, 564, 571-578). ב-PayPalButton עצמו יש הודעה דומה (שורה 178 בקומפוננטה). **חסר**: בתיבת PayPal הראשית (שורות 599-616) אין הודעת Guest Checkout.
3. **Success Redirect** — `PurchaseSuccessModal` מפנה ל-`/library` (קרדיטים) או `/profile` (מנוי). **בעיה**: אמור לחזור ל-`/create` (יצירת סיפור) לפי הדרישה.
4. **הודעות שגיאה** — `PurchaseFailedModal` מציג הודעה בעברית ("משהו השתבש..."). תקין.
5. **יישור UI** — דף Upgrade כבר משתמש ב-`min-h-[100dvh]` ו-`overflow-y-auto` ללא `justify-center`. תקין.

### שינויים נדרשים

**קובץ: `src/pages/Upgrade.tsx`**
- הוספת הודעת Guest Checkout לתיבת PayPal הראשית (שורות 599-616) — `💳 ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל`

**קובץ: `src/components/paywall/PurchaseSuccessModal.tsx`**
- שינוי `redirectPath` עבור רכישת קרדיטים מ-`/library` ל-`/create` כדי שהמשתמש יחזור ליצירת סיפור
- עדכון טקסט הכפתור מ-"עברו לספרייה" ל-"צרו סיפור חדש" עם אייקון מתאים

### מה לא משתנה
- Client ID — תקין (Live)
- הודעות שגיאה בעברית — כבר קיימות
- יישור UI — כבר `100dvh` + top-aligned
- PWA — ללא שינוי

