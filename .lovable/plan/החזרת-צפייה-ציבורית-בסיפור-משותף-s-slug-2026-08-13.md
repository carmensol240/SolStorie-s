# החזרת צפייה ציבורית בסיפור משותף (/s/:slug)

## ממצאים

**א. מדוע נשללה ההרשאה?**
במיגרציה `20260523070630` יש סעיף בשם "Revoke EXECUTE from anon/authenticated on internal/admin SECURITY DEFINER functions". זו הייתה פעולה גורפת על כל פונקציות ה-SECURITY DEFINER (כולל `handle_new_user`, `set_story_slug`, `update_updated_at_column`) כחלק מסבב הקשחת אבטחה — לא החלטה ספציפית לגבי `get_public_story`. הפונקציה נסחפה עם הרשימה. אימות במסד: `proacl` כולל היום רק `postgres`, `authenticated`, `service_role` — ל-`anon` אכן אין הרשאה. אותו דבר קרה גם ל-`get_public_book`.

**ב. מה הפונקציה מחזירה בפועל?**
JSON מצומצם: `id, slug, child_name, topic, age_range, language, cover_url, child_gender`, ובנוסף מערך עמודים עם `page_number, text, illustration_url`.

לא מוחזרים: `user_id`, אימייל, קרדיטים, `child_photo_path`, מזהי ילד/ה, סטטוס תשלום או כל שדה פרטי אחר. הפונקציה כבר מסוננת לשדות בטוחים — בדיוק בדפוס שתיקנו ב-user_feedback.

**הערה:** הפונקציה מחזירה כל סיפור לפי slug (אין דגל `is_public` בטבלת `stories`). ההגנה היא ה-slug האקראי בן 8 תווים — בדיוק ההתנהגות שקישור שיתוף אמור לתת, וזהה למה שכבר קורה דרך פרוקסי ה-OG של `/s/*`.

**מסקנה:** הפונקציה בטוחה לחשיפה ל-anon.

## התוכנית

### א. מיגרציה
החזרת הרשאה מדוייקת, לפונקציה אחת בלבד:

```sql
GRANT EXECUTE ON FUNCTION public.get_public_story(text) TO anon;
```

לא נוגעים בשאר הפונקציות שנשללו (`handle_new_user`, `get_admin_user_emails` וכו') — הן נשארות חסומות.

### ב. תיקון פרונטאנד
`src/pages/PublicStoryViewer.tsx`, שורה 98:

```diff
-    if (!storySlug || authLoading || !user) return;
+    if (!storySlug) return;
```

הסרת התלות ב-`user` וב-`authLoading` מגוף האפקט וממערך התלויות, כך שהשליפה תרוץ מיד גם לאורח/ת. הגבלת 4 העמודים (`DEMO_VIRTUAL_PAGE_LIMIT`) ומודל ההרשמה נשארים כפי שהם ומהווים את מנגנון ההמרה.

## מה לא נוגעים בו

- `get_public_book` — זרימת הפליפבוק המשותף אינה בהיקף הבקשה הזו.
- לוגיקת claim-guest-story, ה-banner, ומגבלת העמודים.
- שום קובץ נוסף.

## בדיקה

- בדיקת TypeScript.
- בדפדפן ללא התחברות: פתיחת `/s/:slug` — הסיפור נטען, נראים עד 4 עמודים (5 לפעוטות), ואז מוצג מסך ההרשמה.