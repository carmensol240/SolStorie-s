## אבחון

בדקתי בקפידה את השינויים מהיום — `vite.config.ts` (manifest של PWA) ו-`InstallAppPrompt.tsx` (טקסט בלבד). **שניהם לא נוגעים בלוגיקה של שמירת פרופיל ילד**. אין שינוי ב-`ChildInfoStep.tsx`, ב-`use-auth.ts`, ב-`user-storage.ts` או בטבלת `children`.

עם זאת, מתוך התיאור שלך ("התמונה החדשה הופכת לתמונת ברירת המחדל של הפרופיל הפעיל") — קיים באג **קיים בקוד** ב-`handleSaveChildProfile` ב-`ChildInfoStep.tsx` (שורה 358):

```ts
const existingChild = savedChildren.find(c => c.name === formData.childName);
if (existingChild) { /* UPDATE */ } else { /* INSERT */ }
```

הזיהוי "האם זה פרופיל קיים" מבוסס **רק על השם**. תרחיש שובר את הזרימה:
1. לוחצים "פרופיל חדש +" → הטופס מתנקה (`childName=""`), אבל `savedChildren` עדיין מכיל את הילדים הקיימים.
2. אם משתמש מקליד שם זהה לפרופיל קיים (או שיש כפל), הקוד מבצע **UPDATE** על הילד הקיים ודורס את התמונה שלו במקום ליצור רשומה חדשה.

## תכנית תיקון (מינימלית, ממוקדת)

**קובץ יחיד**: `src/components/wizard/ChildInfoStep.tsx`

1. הוספת state חדש `isCreatingNew: boolean` (ברירת מחדל `false`).
2. בכפתור **"פרופיל חדש +"** — לקבוע `setIsCreatingNew(true)` בנוסף לניקוי הטופס.
3. בבחירת ילד קיים (`loadChildProfile`) ובטעינה האוטומטית במאונט — לקבוע `setIsCreatingNew(false)`.
4. ב-`handleSaveChildProfile`:
   - אם `isCreatingNew === true` → תמיד **INSERT** (גם ב-DB וגם ב-localStorage), בלי לחפש לפי שם.
   - אם השם החדש מתנגש עם פרופיל קיים → להציג toast שגיאה ("כבר קיים פרופיל בשם הזה") במקום לדרוס.
   - אחרי INSERT מוצלח → `setIsCreatingNew(false)` ולעדכן את הפרופיל הפעיל לחדש.
5. גם בענף ה-localStorage (שורות 417-426) — לאכוף את אותה הלוגיקה.

## מה שלא ישתנה

- אין שינוי ב-`vite.config.ts`, `InstallAppPrompt.tsx`, או כל קומפוננטה אחרת.
- אין שינוי ב-DB, RLS, או edge functions.
- אין שינוי בזרימת העלאת התמונה או יצירת האווטאר.
- אין שינוי בלוגיקת `useChildAvatar` או `user-storage`.

## הערה

אם הבעיה ממשיכה אחרי התיקון, סביר שהדפדפן מציג גרסה ישנה מ-Service Worker (PWA). במקרה כזה אבקש ממך לרענן בכוח (Ctrl+Shift+R) או לבדוק ב-incognito.
