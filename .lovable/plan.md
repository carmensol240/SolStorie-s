

## תיקון ודיוק דפי הפתיחה והספר

### בעיות שזוהו

1. **יישור טקסט** — בעמודי טקסט בלבד (text-only, rainbow background) הטקסט ממורכז אנכית (`flex items-center justify-center`) במקום להתחיל מראש העמוד.
2. **סדר דפים** — הספר כבר נפתח בעמוד שער (`currentPage = -1`), תקין.
3. **דף הקדשה** — כבר קיים בעמוד 0, תקין.
4. **מבנה איורים** — כרגע יש חלוקה לפי pattern של 3 (A, text-only, C). הבקשה היא איור אחד לכל שני דפים: דף עם איור+טקסט, ואחריו דף טקסט בלבד. כלומר pattern של 2.
5. **PWA** — כבר מוגדר, ללא שינוי.

### שינויים בקובץ `src/pages/StoryViewer.tsx`

| שינוי | פירוט |
|-------|-------|
| יישור טקסט Top-aligned | בכל עמוד תוכן (עם איור ובלי), להחליף `items-center justify-center` ל-`items-start justify-start` כדי שהטקסט יתחיל מראש העמוד |
| מבנה layout מ-3 ל-2 | שינוי `contentPageOffset` מ-`% 3` ל-`% 2`: offset 0 = דף עם איור + טקסט, offset 1 = דף טקסט בלבד |
| הסרת Pattern C | מכיוון שעכשיו יש רק שני סוגי עמודים (עם/בלי איור), ה-Pattern C (איור בצד שמאל) מיותר |

### שינויים בקובץ `src/pages/PublicStoryViewer.tsx`

| שינוי | פירוט |
|-------|-------|
| יישור טקסט Top-aligned | בעמודי טקסט בלבד, להחליף `items-center justify-center` ל-`items-start` |

### שינויים בקובץ `src/components/story/book-frame/BookPage.tsx`

| שינוי | פירוט |
|-------|-------|
| יישור טקסט Top-aligned | בעמוד טקסט, להחליף `items-center justify-center` ל-`items-start` |

### סיכום
- 3 קבצים ישתנו
- ללא שינוי ב-DB, PWA, או edge functions
- הספר ימשיך להיפתח בעמוד השער עם סול כגיבורת-על
- דף ההקדשה נשאר כפי שהוא
- הטקסט ייצמד לראש העמוד בכל מקום

