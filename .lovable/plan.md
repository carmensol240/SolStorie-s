

## שני איורים בכל עמוד לגיל 0-2

### הבעיה
בסיפורי גיל 0-2 הטקסט קצר מאוד (1-2 משפטים) ולכן דפי הטקסט נראים ריקים וחסרי עניין.

### פתרון — שלושה שכבות שינוי

#### 1. מסד נתונים — עמודות חדשות ב-`story_pages`
הוספת שתי עמודות:
- `illustration_prompt_2` (text, nullable) — פרומפט לאיור שני
- `illustration_url_2` (text, nullable) — URL לאיור שני

#### 2. Backend — יצירת שני איורים לכל עמוד (גיל 0-2 בלבד)

**`supabase/functions/generate-story/index.ts`:**
- לגיל 0-2 בלבד: כל עמוד מקבל `illustration_prompt` (לא רק עמודים אי-זוגיים)
- הוספת הנחיה ל-AI לייצר שני פרומפטים לכל עמוד: `illustration_prompt` (סצנה ראשית) ו-`illustration_prompt_2` (אותה סצנה מזווית אחרת / רגע עוקב)
- שמירת שני הפרומפטים ב-DB

**`supabase/functions/generate-illustrations/index.ts`:**
- בדיקה אם לעמוד יש `illustration_prompt_2`
- אם כן — ייצור איור נוסף ושמירתו ב-`illustration_url_2`

#### 3. Frontend — פריסה חדשה לגיל 0-2

**`src/pages/StoryViewer.tsx`:**
- שינוי לוגיקת `virtualPages` לגיל 0-2: במקום הדפוס הנוכחי (2 טקסטים → 1 איור), כל עמוד DB הופך לעמוד וירטואלי אחד מסוג `combined`
- סוג וירטואלי חדש `combined` שמכיל: איור עליון + טקסט באמצע + איור תחתון
- הפריסה: תמונה (40% גובה) → טקסט קצר (20%) → תמונה (40%)
- אם האיור השני עדיין בטעינה — מוצג skeleton/placeholder

### זרימת נתונים

```text
generate-story (0-2)
  → כל עמוד: illustration_prompt + illustration_prompt_2
  → שמירה ב-DB
  → שליחת 2 קריאות generate-illustrations לכל עמוד

generate-illustrations
  → מייצר illustration_url
  → אם יש prompt_2 → מייצר illustration_url_2

StoryViewer (0-2)
  → virtualPages: כל DB page → combined page
  → פריסה: [איור1] [טקסט] [איור2]
```

### קבצים שישתנו
1. **מיגרציה** — הוספת `illustration_prompt_2` ו-`illustration_url_2` ל-`story_pages`
2. **`supabase/functions/generate-story/index.ts`** — לוגיקת פרומפטים כפולים לגיל 0-2
3. **`supabase/functions/generate-illustrations/index.ts`** — ייצור איור שני
4. **`src/pages/StoryViewer.tsx`** — סוג virtual page חדש ופריסה combined
5. **`src/integrations/supabase/types.ts`** — יתעדכן אוטומטית אחרי המיגרציה

