

## תיקון קריטי: איורים לא נוצרים בגלל חריגת Timeout

### שורש הבעיה

`generate-illustrations` רץ כ-Edge Function עם timeout מקסימלי של ~150 שניות. בעקבות המעבר לייצור **סדרתי**, הפונקציה מנסה לייצר 4 איורים אחד אחרי השני — כל איור לוקח ~50-80 שניות (ה-cover לבד לקח 81 שניות). סה"כ: **200-320 שניות**, שחורג מהמגבלה. הפונקציה נהרגת ("shutdown") לפני שמספיקה לסיים.

ה-cover מצליח כי הוא רץ כ-Edge Function נפרד (קריאה אחת בלבד).

### הפתרון: ייצור מבוזר — קריאה נפרדת לכל איור

במקום ש-`generate-story` יפעיל קריאה אחת ל-`generate-illustrations` עבור כל האיורים, הוא יפעיל **N קריאות נפרדות** — אחת לכל עמוד שדורש איור. כל קריאה תטפל בעמוד אחד בלבד ותסתיים תוך ~80 שניות.

### שינויים

**קובץ: `supabase/functions/generate-illustrations/index.ts`**
- הוספת פרמטר אופציונלי `singlePageNumber` ל-request body
- אם `singlePageNumber` מסופק: מייצר איור רק לעמוד הזה (במקום לכל העמודים)
- אם לא מסופק: התנהגות נוכחית (backward compatible)
- עדכון סטטוס הסיפור ל-"ready" רק אחרי שכל הקריאות סיימו — באמצעות בדיקה שכל העמודים עם illustration_prompt כבר יש להם illustration_url

**קובץ: `supabase/functions/generate-story/index.ts`**
- במקום קריאה אחת ל-`generate-illustrations`, שליחת קריאה נפרדת לכל עמוד שדורש איור (page_number 1, 3, 5, 7)
- כל קריאה כוללת את הפרמטר `singlePageNumber`
- כל הקריאות fire-and-forget במקביל (כל אחת Edge Function נפרד)

### מה לא משתנה
- PayPal Live — כבר תקין
- ניווט חיצי קשת צבעוניים — כבר תקין
- יישור top-aligned — כבר תקין
- איורים full-width — כבר תקין
- סנכרון ל-GitHub — אוטומטי אחרי שמירה

### סיכום טכני

| קובץ | שינוי |
|-------|--------|
| `generate-illustrations/index.ts` | תמיכה ב-`singlePageNumber` לייצור עמוד בודד + עדכון סטטוס חכם |
| `generate-story/index.ts` | שליחת N קריאות נפרדות במקום קריאה אחת |

