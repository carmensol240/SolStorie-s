# תיקון קופון "סיפור מלא" – גישה לקובץ ההדפסה

## מה נמצא (נבדק במסד ובקוד)
- הלקוחה: 0 קרדיטים, שורת pdf_entitlements אחת עם story_id ריק (מהקופון), והסיפור 3a2d5c15 רשום כ-credit_digital.
- ברכישה ב-Grow של סיפור מלא, הקרדיט נרשם גם כ"מנה מלאה" (story_credit_lots). כשיוצרים סיפור, השרת מנצל קודם מנה מלאה, ואז נותן לסיפור גם קובץ הדפסה (pdf_entitlements עם story_id) – grantStoryAccess.
- מימוש קופון מוסיף רק story_credits רגילים + הרשאה כללית בלי סיפור, ולכן הקרדיט נחשב דיגיטלי. זה שורש הבאג.
- במסד אין כרגע אף מנה מלאה ואף הרשאת הדפסה עם סיפור, כלומר המסלול המלא מעולם לא רץ באמת.

## א. תיקון הנתונים של הלקוחה
- להוסיף pdf_entitlements: user = הלקוחה, story_id = 3a2d5c15…, source = gift_coupon:ORTAL-FULL-7K3Q.
- לעדכן את רשומת הפתיחה של הסיפור מ-credit_digital ל-credit_full (לשקף נכון).
- לא לגעת בקרדיטים שלה ובשורה הכללית הקיימת.
- בדיקה: לפתוח את הסיפור כמשתמשת הזו (אם אפשר) או לשאול את המסד כפי שמסך הסיפור שואל, ולוודא שהכפתור "34.90" לא מופיע.

## ב. תיקון המנגנון (אותו מסלול כמו Grow)
- בפונקציית מימוש הקופון: כש-grants_global_pdf פעיל, במקום ליצור הרשאה כללית בלי סיפור – ליצור מנה מלאה (story_credit_lots, kind = full, remaining = מספר הסיפורים בקופון, order_id = coupon_<קוד>_<משתמש>), בדיוק כמו ש-applyPurchaseCredits עושה ב-Grow.
- מכאן, יצירת הסיפור הבא מנצלת את המנה המלאה ו-grantStoryAccess נותן את קובץ ההדפסה לסיפור – בלי קוד חדש בצד יצירת הסיפור.
- הרשאות ההרצה של הפונקציה (רק service_role) נשמרות כמו היום.
- הקופונים עצמם לא משתנים; REUT-FULL-1 לא נוגעים ולא ממומש.

## ג. בדיקת רכישת "סיפור מלא" ב-Grow
- בדיקה אוטומטית קטנה (ליד הבדיקות הקיימות) עם מסד מדומה: applyPurchaseCredits לחבילה popular יוצרת מנה מלאה; consume_story_credit נותן "full"; grantStoryAccess יוצר pdf_entitlements עם story_id.
- בדיקה אמיתית על חשבון בדיקה בלבד (מצב test, 0 ₪, לא קופון אמיתי): רכישת סיפור מלא → יצירת סיפור → לוודא שורה ב-pdf_entitlements עם story_id ושהכפתור "34.90" לא מופיע. אחר כך לנקות את נתוני הבדיקה.
- להריץ bun run test.

## לא משתנה
מחירים, קופונים קיימים (כולל REUT-FULL-1), יצירת סיפור, הקורא, וכל דבר אחר.

## פרטים טכניים
- מיגרציה: CREATE OR REPLACE FUNCTION redeem_coupon_atomic – החלפת ה-INSERT ל-pdf_entitlements ב-INSERT ל-story_credit_lots ... ON CONFLICT (order_id, kind) DO NOTHING; אחריה REVOKE/GRANT מחדש (service_role בלבד).
- תיקון נתונים דרך run_sql: INSERT pdf_entitlements (ON CONFLICT DO NOTHING) + UPDATE story_unlocks SET unlock_type='credit_full' WHERE id='51a710b3-…'.
