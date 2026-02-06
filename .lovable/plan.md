

# תכנית תיקון: מעבר לארכיטקטורת Queue לפתרון בעיית Timeout

## סיכום הבעיה

הפונקציה `generate-story` כושלת עם **504 Gateway Timeout** (160 שניות) כי היא מנסה לבצע את כל הפעולות הבאות באופן סינכרוני:
1. יצירת טקסט הסיפור (2-5 שניות)
2. יצירת פרופיל דמות (3-5 שניות)
3. יצירת 4-8 איורים במקביל (10-60 שניות לכל אחד)
4. העלאת האיורים ל-Storage
5. שמירת העמודים למסד הנתונים

מגבלת Edge Functions היא 150 שניות - לא מספיק!

## הפתרון המוצע: ארכיטקטורת שני שלבים

### שלב 1: יצירה מהירה (Edge Function קצרה)
- יצירת טקסט הסיפור בלבד (מהיר!)
- שמירת הסיפור עם סטטוס `generating_illustrations`
- החזרת `storyId` מיידית ללקוח
- **זמן צפוי: 5-10 שניות**

### שלב 2: יצירת איורים ברקע (Edge Function נפרדת)
- הפעלה אסינכרונית מיד לאחר שלב 1
- יצירת כל איור בנפרד עם עדכון DB
- עדכון סטטוס ל-`ready` בסיום
- **הלקוח יעבור לדף הסיפור ויראה טעינה עד שהאיורים מוכנים**

## שינויים טכניים

### 1. עדכון טבלת `stories` - הוספת עמודת סטטוס

```sql
ALTER TABLE stories ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'ready';
-- ערכים אפשריים: 'generating_text', 'generating_illustrations', 'ready', 'failed'
```

### 2. יצירת Edge Function חדשה: `generate-illustrations`

פונקציה שמקבלת `storyId` ויוצרת את כל האיורים אחד-אחד:

```text
supabase/functions/generate-illustrations/index.ts
```

**תהליך הפונקציה:**
1. קבלת `storyId` ונתוני הסיפור מה-DB
2. עבור כל עמוד:
   - יצירת איור
   - העלאה ל-Storage
   - עדכון ה-DB
3. עדכון סטטוס הסיפור ל-`ready`

### 3. עדכון `generate-story` (הפונקציה הקיימת)

**לפני:**
```
יצירת טקסט → יצירת כל האיורים → שמירה → החזרת storyId
```

**אחרי:**
```
יצירת טקסט → שמירה עם סטטוס "generating_illustrations" 
→ קריאה אסינכרונית ל-generate-illustrations → החזרת storyId מיידית
```

### 4. עדכון דף צפייה בסיפור (`StoryViewer.tsx`)

**שינויים:**
- בדיקת סטטוס `generation_status` 
- אם `generating_illustrations` - הצגת מסך טעינה יפה עם אנימציות
- Polling כל 3 שניות עד שהסטטוס משתנה ל-`ready`
- הצגה הדרגתית של עמודים ככל שהאיורים מוכנים

### 5. עדכון מסך הטעינה (`GeneratingStep.tsx`)

**שינויים:**
- צמצום זמן המתנה מ-90+ שניות ל-10-15 שניות
- הודעה ברורה: "הסיפור מוכן! האיורים מתעדכנים..."
- מעבר מהיר יותר לדף הסיפור

## תרשים זרימה חדש

```text
[משתמש יוצר סיפור]
         ↓
[generate-story Edge Function]
   - יוצר טקסט (5 שניות)
   - שומר סיפור עם סטטוס 'generating_illustrations'
   - קורא ל-generate-illustrations (fire-and-forget)
   - מחזיר storyId מיידית ← [משתמש עובר לדף הסיפור]
         ↓
[generate-illustrations Edge Function] (רץ ברקע)
   - עמוד 1: איור → העלאה → עדכון DB
   - עמוד 2: איור → העלאה → עדכון DB
   - ...
   - עמוד אחרון → עדכון סטטוס ל-'ready'
         ↓
[דף הסיפור מתעדכן אוטומטית]
```

## קבצים שיווצרו/יעודכנו

| קובץ | פעולה |
|------|-------|
| `supabase/functions/generate-illustrations/index.ts` | חדש |
| `supabase/functions/generate-story/index.ts` | עדכון |
| `src/pages/StoryViewer.tsx` | עדכון |
| `src/components/wizard/GeneratingStep.tsx` | עדכון |
| `supabase/config.toml` | הוספת פונקציה חדשה |
| מיגרציה לטבלת stories | הוספת עמודה |

## יתרונות הפתרון

1. **אין יותר Timeout** - הפונקציה הראשית מחזירה תוך 10 שניות
2. **חוויית משתמש טובה יותר** - המשתמש רואה את הסיפור מיד
3. **עמידות בתקלות** - אם איור אחד נכשל, השאר עדיין נוצרים
4. **סקלאביליות** - אפשר להוסיף עוד עמודים בלי לפחד מ-timeout

