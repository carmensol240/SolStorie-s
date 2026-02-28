

## תיקון UI/UX למובייל כרום

### בעיות שזוהו

1. **מרכוז אנכי במסך Auth** — שורה 1056: `items-center justify-center` דוחס אלמנטים למרכז כשהמקלדת או שורת הכתובת משנות את גובה ה-viewport
2. **גובה viewport** — `h-screen h-[100dvh]` כבר קיים בשורה 1045, אבל ה-`justify-center` גורם לדחיסה
3. **ריווח בין שדות** — ה-spacing (`space-y-4`) תקין אבל הדחיסה מ-`justify-center` גורמת לחפיפה

### שינויים בקובץ `src/pages/Auth.tsx`

| שורה | שינוי |
|-------|-------|
| 1056 | הסרת `justify-center` → `justify-start pt-8` כך שהתוכן יתחיל מלמעלה עם padding קטן |
| 515 | Loader screen: שינוי ל-`justify-start pt-20` |

### שינויים בקובץ `src/index.css`

| שינוי | פירוט |
|-------|-------|
| קלאסים גלובליים | הוספת כלל `items-center justify-center` override עבור `.card, .info-box, .menu-item` — הסרת ה-`justify-content: center` והחלפתו ב-`justify-content: flex-start` |

### שינויים בקובץ `src/pages/Home.tsx`

- סריקה והסרת `items-center justify-center` מ-containers ראשיים (אם קיימים)

### סיכום
- תיקון עיקרי: הסרת מרכוז אנכי במסך Auth שגורם לדחיסה במובייל
- 100dvh כבר מוגדר
- PWA כבר מוגדר ללא שינוי
- שפה עברית — כבר תקינה בטפסי Auth

