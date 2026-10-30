# תיקוני אבטחה לפני פרסום

## מה מצאתי
1. **generate-topic-images / generate-hero-image:** אף מקום באתר לא קורא להן. תמונות הנושאים נטענות ישירות מהאחסון. לכן הן יושבתו ויחזירו 410, כמו create-gift-coupon.
2. **azure-speech-tts:** אף מקום באתר לא קורא לה, גם לא בסיפור משותף (/s/...). לכן היא תדרוש התחברות, ובנוסף תוגבל ל-3,000 תווים לבקשה ותקבל הגבלת קצב לפי IP.
3. **redeem_coupon_atomic:** רק redeem-coupon קוראת לה, עם service role ואחרי בדיקת התחברות. grow-webhook יוצר קופונים ישירות בטבלה ולא קורא לפונקציה הזאת, ולכן מסלול המתנות לא מושפע.
4. **send-feedback-notification:** נקראת מעמוד הסיפור, בלי הגבלת קצב.
5. **send-contact-form:** השולח הוא noreply@storytime.org.il.

## מה ישתנה
- `supabase/functions/generate-topic-images/index.ts`, `supabase/functions/generate-hero-image/index.ts`: יחזירו 410 מיד, בלי לקרוא ל-AI ובלי לגשת לאחסון.
- `supabase/functions/azure-speech-tts/index.ts`: בדיקת התחברות (401 בלי התחברות), טקסט מעל 3,000 תווים יקבל 400, והגבלת קצב לפי IP (30 בקשות לשעה).
- `supabase/functions/send-feedback-notification/index.ts`: הגבלת קצב לפי IP (10 לשעה), באותו מנגנון של send-contact-form.
- `supabase/functions/_shared/rate-limiter.ts`: נוספות שתי הגדרות מגבלה, tts ו-feedback.
- `supabase/functions/send-contact-form/index.ts`: השולח ישתנה ל-noreply@soulstory.co.il. לא יישלח מייל בדיקה.
- מיגרציה: REVOKE EXECUTE על redeem_coupon_atomic מ-PUBLIC, anon ו-authenticated, ו-GRANT רק ל-service_role. הפונקציה עצמה לא משתנה, וגם הקופונים לא משתנים.

## בדיקות
- אחרי המיגרציה אבדוק בשאילתה שרק service_role יכולה להריץ את redeem_coupon_atomic.
- אשלח קוד קופון שלא קיים דרך redeem-coupon. אמורה לחזור "קוד קופון לא תקף", וכך יוודא שהקריאה עדיין עובדת בלי לממש שום קופון. לא אגע ב-REUT-FULL-1.
- אקרא לפונקציות המושבתות ואוודא שחוזר 410. אשלח ל-TTS קריאה בלי התחברות ואוודא שחוזר 401. אשלח טקסט ארוך ואוודא שחוזר 400.
- אריץ `bun run test` ואדווח מה עבר ומה נכשל.

## הערכת עלות
שינוי קטן: 6 קבצים ומיגרציה אחת, ובערך 1 עד 2 קרדיטים.
