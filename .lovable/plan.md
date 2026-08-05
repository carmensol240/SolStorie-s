# דוח: אזהרת "Users can escalate their own privileges by modifying protected profile columns"

## 1. באילו עמודות מדובר
בטבלת `profiles` יש 31 עמודות. הרגישות שבהן (כאלה שמשפיעות על הרשאות/כסף):
`user_role`, `is_subscriber`, `story_credits`, `coloring_credits`, `editing_credits`,
`free_edits_remaining`, `free_edits_total`, `daily_edit_credits`, `last_edit_credits_reset`,
`share_coins`, `first_purchase_bonus_given`, `education_bonus_claimed`,
`commercial_abuse_flagged`, `commercial_abuse_flagged_at`.

"הסלמת הרשאות" כאן פירושה בעיקר **הענקה עצמית של קרדיטים/מנוי/הטבת חינוך** — כלומר קבלת מוצר בלי לשלם — ולא הפיכה לאדמין.

## 2. האם משתמשת יכולה להפוך את עצמה לאדמין
לא. תפקידי אדמין **אינם** ב-`profiles` אלא בטבלה נפרדת `public.user_roles`, שנבדקת דרך `has_role()`.
המדיניות על `user_roles`:
- קריאה: רק השורות של המשתמשת עצמה.
- כתיבה (ALL): רק כשה-JWT הוא `service_role`.
כלומר אין שום נתיב מהלקוח להוסיף לעצמה `admin`. גם `profiles.user_role` (parent/educator) אינו מקנה הרשאות אדמין — רק הטבת קרדיט חד-פעמית.

## 3. האם יש היום הגנה בפועל
כן, שתי שכבות:
- **RLS**: `Users can update their own profile` מוגבל ל-`authenticated` עם `auth.uid() = id`, ומדיניות RESTRICTIVE שחוסמת אנונימיים. משתמשת יכולה לעדכן רק את השורה שלה.
- **טריגר `prevent_profile_privilege_escalation_trg`** (BEFORE UPDATE, פעיל — `tgenabled = 'O'`): זורק שגיאה אם מישהו שאינו `service_role` מנסה לשנות אחת מכל 14 העמודות הרגישות שנמנו למעלה.
כלומר עדכון מהלקוח מוגבל בפועל לשדות תצוגה בלבד (שם, אימוג'י, טלפון, הסכמות וכו').

## 4. האם נוצל בפועל
לא נמצאה עדות לניצול. בדיקת נתונים (131 פרופילים):
- `is_subscriber = true`: 0 משתמשות.
- `education_bonus_claimed = true`: 0.
- `editing_credits` מקסימלי: 0; `coloring_credits` מקסימלי: 11.
- `story_credits` מקסימלי: 981 — שייך לחשבון אדמין קיים (מופיע ב-`user_roles`), לא חריגה.
- 33 מסומנות `educator`, ערך שנקבע בהרשמה ב-`handle_new_user` ומוגבל ל-parent/educator; אף אחת לא קיבלה בונוס חינוך.
המסקנה: הממצא **תיאורטי**, וכבר מנוטרל בפועל על ידי הטריגר.

## 5. פערים קטנים שנותרו (לא קריטיים, לידיעה בלבד)
- `Users can insert their own profile` מוגדר לרול `public` ולא `authenticated` (ה-`WITH CHECK (auth.uid() = id)` עדיין חוסם, וגם ה-RESTRICTIVE חוסם אנונימיים) — ניסוח בלבד.
- ה-INSERT הראשוני אינו עובר את הטריגר (הוא BEFORE UPDATE בלבד); בפועל הפרופיל נוצר על ידי `handle_new_user` עם 0 קרדיטים, אבל upsert מהלקוח יכול תיאורטית להכניס שורה עם קרדיטים אם השורה עדיין לא קיימת. זו נקודת התיקון היחידה ששווה לשקול.

## אם תרצי שאתקן
תיקון מוצע (מיגרציה אחת, ללא שינוי קוד לקוח): להרחיב את הטריגר גם ל-INSERT כך שיאפס/יחסום ערכים רגישים בהכנסה מהלקוח, ולצמצם את מדיניות ה-INSERT ל-`authenticated`.
