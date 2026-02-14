
# הוספת שדה "שם הכיתה/הגן" למחנכים

## סקירה
רוב הפיצ'רים שביקשת כבר מיושמים מהסבב הקודם (בחירת תפקיד, חבילת מחנכים, ארגז כלים חינוכי, מתג ניקוד, כפתור עריכה, הסרת הקראה, מדיניות פרטיות, אורך לפי גיל). הפיצ'ר החדש היחיד שטרם מומש הוא **שדה "שם הכיתה/הגן"** למחנכים, שמועבר ל-AI ומשולב בסיפור.

---

## מה ישתנה

### 1. הוספת שדה `className` ל-StoryFormData
- קובץ: `src/pages/CreateStory.tsx`
- הוספת שדה `className: string` לממשק `StoryFormData` ולערכי ברירת מחדל

### 2. הצגת שדה "שם הכיתה/הגן" בטופס יצירת הסיפור
- קובץ: `src/components/wizard/ChildInfoStep.tsx`
- הוספת שדה טקסט חדש שמוצג **רק למשתמשים בתפקיד מחנכ/ת**
- השדה ישלוף את `user_role` מטבלת `profiles` ויציג את השדה בהתאם
- Placeholder: "לדוגמה: כיתת הדבורים, גן חבצלת"

### 3. העברת שם הכיתה לפונקציית יצירת הסיפור
- קובץ: `src/components/wizard/GeneratingStep.tsx`
- הוספת `className` לגוף הבקשה שנשלח ל-`generate-story`

### 4. שילוב שם הכיתה בפרומפט ה-AI
- קובץ: `supabase/functions/generate-story/index.ts`
- קליטת השדה `className` מהבקשה
- ולידציה (מקסימום 100 תווים)
- הוספת הנחיה לפרומפט: "שם הכיתה/הגן: [שם]. שלב את שם הכיתה/הגן בסיפור בצורה טבעית, לדוגמה: 'ילדי [שם הכיתה] התרגשו מאוד...'"

---

## סיכום קבצים שישתנו

| קובץ | שינוי |
|-------|-------|
| `src/pages/CreateStory.tsx` | הוספת `className` ל-`StoryFormData` |
| `src/components/wizard/ChildInfoStep.tsx` | שדה טקסט חדש למחנכים |
| `src/components/wizard/GeneratingStep.tsx` | העברת `className` לבקשת API |
| `supabase/functions/generate-story/index.ts` | קליטה, ולידציה ושילוב בפרומפט |
