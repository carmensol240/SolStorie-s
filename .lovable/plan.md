# הוספת מדיניות RLS מגבילה לטבלת premium_story_pages

## שינוי מתוכנן
הוספת מדיניות RLS מסוג RESTRICTIVE לטבלה `public.premium_story_pages` ב-Supabase.

המדיניות תחול על הפעולות:
- SELECT
- INSERT
- UPDATE
- DELETE

היא תאפשר גישה רק אם מתקיים אחד מהתנאים הבאים:
1. קיימת רשומה ב-`story_unlocks` עבור אותו משתמש (`auth.uid()`) ואותו סיפור (`story_id`).
2. המשתמש הוא מנהל (`has_role(auth.uid(), 'admin')`).

## מה לא נוגעים בו
- המדיניות המתירנית הקיימת "Users who unlocked can view premium story pages" נשארת ללא שינוי.
- המדיניות החוסמת לאנונימיים "Deny anonymous access to premium_story_pages" נשארת ללא שינוי.
- מדיניות המנהלים הקיימות נשארות ללא שינוי.
- לא ניגע בטבלאות אחרות, בקבצי קוד, בפונקציות או בלוגיקה אחרת.

## סיבה
מדיניות RESTRICTIVE פועלת כשכבת "AND" נוספת על כל המדיניות המתירניות. כך, גם אם מדיניות מתירנית עתידית תכיל באג או תתנהג בצורה בלתי צפויה, מדיניות זו תשמור על חסימת ברירת המחדל למשתמשים מחוברים ללא רכישה. החריגה למנהלים נדרשת כדי לא לשבור את גישת האדמין לניהול התוכן.

## ה-SQL המתוכנן
```sql
CREATE POLICY "Restrict premium_story_pages to unlocked users or admins"
ON public.premium_story_pages
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.story_unlocks su
    WHERE su.story_id = premium_story_pages.story_id
      AND su.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.story_unlocks su
    WHERE su.story_id = premium_story_pages.story_id
      AND su.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);
```
