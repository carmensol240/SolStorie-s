# בדיקת עקביות לבוש פרוגרמטית (Wardrobe Drift Detection)

## מצב נוכחי
בתיקון האחרון נכללו **רק** שינויי פרומפט:
- בלוק "נעילת לבוש" ב-SYSTEM_PROMPT (עברית) ו-`Wardrobe lock` באנגלית
- עוגן לבוש למסלול המלל החופשי
- ניסוח `illustration_prompt` שדורש "the SAME clothing as page 1"

**לא נוספה** שום בדיקה בקוד שמשווה בפועל את תיאורי הלבוש בין העמודים. אין לוג התרעה.

## מה ייבנה

### 1. פונקציית זיהוי לבוש
פונקציה חדשה `extractWardrobeTokens(prompt: string)` ב-`supabase/functions/generate-story/index.ts`:
- מנרמלת את ה-`illustration_prompt` (lowercase)
- מוציאה מילות פריטי לבוש מרשימה סגורה (shirt, t-shirt, cape, dress, overalls, pants, shorts, skirt, boots, sneakers, hat, cap, jacket, coat, pajamas, suit, belt, gloves, crown, headband) יחד עם צבע צמוד לפניהן (red, blue, yellow, green, purple, pink, white, black, gold, silver, orange, brown, grey/gray)
- מחזירה קבוצה של צמדי `color+item` (למשל `yellow shirt`, `red cape`)

### 2. השוואה בין העמודים
אחרי שהסיפור נוצר ולפני ההחזרה ללקוח:
- העמוד הראשון שיש לו `illustration_prompt` הוא ה"בסיס"
- לכל עמוד נוסף עם `illustration_prompt` מחושב הפרש: פריטים שנעלמו, ופריטים שהופיעו בצבע שונה מהבסיס
- **חריג מוסבר:** אם טקסט העמוד (עברית או אנגלית) מכיל מילת שינוי לבוש — פיג'מה/פיג'מת, מעיל, מתלבש, מחליף/ה בגדים, בגד ים, מעיל גשם, pajamas, coat, changes into, swimsuit — הסטייה נחשבת מוסברת ולא מדווחת

### 3. לוג התרעה
כשמזוהה סטייה לא-מוסברת:
```
console.warn("[WARDROBE_DRIFT]", { storyId, page: n, baseline: [...], found: [...], missing: [...] })
```
שורת סיכום אחת בסוף: כמה עמודים סטו מתוך כמה נבדקו.

### 4. גבולות מכוונים
- **בדיקה בלבד** — לא משנה את הפרומפטים, לא מפעילה ניסיון חוזר, לא חוסמת החזרת סיפור
- לא נוגעת בייצור התמונות, בחיובים או ב-UI
- אם הפרסור נכשל מכל סיבה — נבלע ב-try/catch ולא משפיע על יצירת הסיפור

## אימות
יצירת סיפור בדיקה במלל חופשי עם תלבושת גיבור-על מפורשת, וקריאת לוגי ה-Edge Function כדי לוודא שהבדיקה רצה ומדווחת נכון (או שותקת כשאין סטייה).
