

## אופטימיזציית תהליך יצירת הסיפור — הצגה מיידית של טקסט + טעינה פרוגרסיבית של איורים

### מצב נוכחי

1. הלקוח קורא ל-`generate-story` → **ממתין ~20-30 שניות** לטקסט מלא → מקבל `storyId`
2. איורים רצים ברקע (מבוזר, עמוד אחד לכל קריאה)
3. הלקוח סופר (**polling**) עד ש-2 איורים מוכנים → רק אז מנווט לסיפור
4. **זמן המתנה כולל: ~60-90 שניות** עד שהמשתמש רואה משהו

### הבעיה

המשתמש מחכה דקה+ בלי לראות תוכן. הטקסט כבר מוכן אחרי ~25 שניות, אבל הוא לא מוצג עד שגם 2 איורים מוכנים.

### הפתרון: ניווט מיידי אחרי הטקסט + Skeleton loading לאיורים

**עיקרון**: ברגע שהטקסט מוכן — מנווטים לסיפור. האיורים מופיעים בזמן אמת (Realtime subscription) ככל שהם נוצרים, עם skeleton placeholder עד אז.

### שינויים נדרשים

**1. `src/components/wizard/GeneratingStep.tsx`**
- שינוי: ברגע שהטקסט מוכן (`storyId` התקבל), מנווט מיידית לסיפור **ללא המתנה לאיורים**
- הסרת שלב ה-`illustrations` מה-polling — האיורים יטענו פרוגרסיבית בתוך StoryViewer
- שמירת פרמטר `?new=true` ב-URL כדי ש-StoryViewer ידע להציג skeleton

**2. `src/pages/StoryViewer.tsx`**
- הוספת Realtime subscription על טבלת `story_pages` — מאזין לשינויים ב-`illustration_url`
- כשאיור מתעדכן ב-DB, הוא מופיע מיידית בעמוד ללא refresh

**3. `src/components/story/book-frame/BookPage.tsx`**
- הוספת מצב skeleton/placeholder: כשאין `illustration_url` אבל יש `illustration_prompt` → מציג אנימציית skeleton יפה עם הודעה "האיור נוצר..."
- כשה-`illustration_url` מגיע (דרך Realtime) → fade-in של האיור

**4. `supabase/functions/generate-story/index.ts`**
- שינוי קטן: הזנקת איורים **בזמן שה-nikud רץ ברקע**, לא אחריו — חיסכון של ~5 שניות
- כבר מיושם בגדול, רק סידור סדר הפעולות

### מה לא משתנה
- ה-Edge Functions של האיורים — כבר מבוזרים ומקביליים
- מבנה ה-JSON של generate-story — נשאר כמו שהוא
- PayPal, ניווט, יישור — ללא שינוי

### תוצאה צפויה

| מדד | לפני | אחרי |
|------|-------|--------|
| זמן עד תצוגת תוכן | ~60-90 שניות | ~25-30 שניות |
| חוויית המתנה | מסך טעינה סטטי | סיפור מוצג מיידית, איורים מופיעים בזמן אמת |
| איורים | מחכה ל-2 לפני ניווט | מוצגים פרוגרסיבית עם skeleton |

### סיכום טכני

| קובץ | שינוי |
|-------|--------|
| `GeneratingStep.tsx` | ניווט מיידי אחרי טקסט, ללא המתנה לאיורים |
| `StoryViewer.tsx` | Realtime subscription על `story_pages.illustration_url` |
| `BookPage.tsx` | Skeleton placeholder לאיורים חסרים + fade-in |
| DB | `ALTER PUBLICATION supabase_realtime ADD TABLE story_pages` |

