## הבעיה

בקומפוננטה `src/components/upgrade/FlippingBookAnimation.tsx` (שמופיעה בדף `/upgrade`), על גב הספר מוצג טקסט ברירת מחדל "הסיפור של הסיפור שלך" כשאין שם זמין. הקומפוננטה כיום שולפת שם מטבלת `children`, ולא מהפרופיל של המשתמש.

## התיקון

לעדכן את `FlippingBookAnimation.tsx` כך שישלוף את שם הילד מטבלת `profiles` ב-Supabase במקום מטבלת `children`.

### סדר העדיפויות לשם המוצג

1. `profiles.first_name` (הכי מועדף — שם פרטי נקי)
2. `profiles.display_name` (גיבוי)
3. fallback ל-`children.name` של הילד האחרון שנוצר (לתאימות אחורה, אם בפרופיל אין שם)
4. אם אין כלום — להציג רק "הסיפור שלי" (ולא "הסיפור של הסיפור שלך")

### שינויים בקובץ

`src/components/upgrade/FlippingBookAnimation.tsx`:
- להחליף את ה-`useEffect` שמושך מ-`children` בשאילתה שמושכת קודם את `first_name, display_name` מ-`profiles` לפי `user.id`.
- אם שניהם ריקים — לבצע fallback ל-`children` כפי שקיים היום.
- ה-state `childName` יישאר, אבל ה-default יהיה `"הסיפור שלי"` במקום `"הסיפור שלך"` כדי שגם במקרה הקיצון לא יופיע הטקסט הכפול "הסיפור של הסיפור שלך".
- הרינדור (`{childName}` ו-`💛 הסיפור של {childName}`) נשאר זהה.

### מה לא משתנה

- שום קובץ אחר.
- הלוגיקה של הרכישה, ה-state של הסיפור, או ה-RLS.
- העיצוב והאנימציה של הספר.
