# הרשאת מייל בדיקה + הגבלה ל-3 + תיקון סוג חבילה

## 1. verify-purchase — רשימת מיילים מורשית + מגבלת 3
בקובץ `supabase/functions/verify-purchase/index.ts`:
- להחליף את הקבוע `WHITELISTED_TEST_EMAIL` במערך `WHITELISTED_TEST_EMAILS` שמכיל **רק** `shirley.u85@gmail.com`.
- בבדיקת ה-testMode: לאשר רק אם המייל (lowercase) נמצא במערך, אחרת 403.
- מיד אחרי אישור המייל, לספור ב-`purchases` את הרשומות של אותו `user_id` שנוצרו במצב בדיקה (שם החבילה מתחיל ב-`test_`, שהוא הפורמט ש-`applyPurchaseCredits` כותב עבור `source: "test"`).
  - 3 ומעלה → החזרת 403 עם הודעה "מכסת רכישות הבדיקה נוצלה".
  - פחות מ-3 → ממשיכים כרגיל.

## 2. Upgrade.tsx — סוג חבילה
בפונקציה `handleTestPurchase` לשנות `packageId: "single_story_full"` ל-`packageId: "popular"`. שום שינוי אחר בעמוד.

## מה לא משתנה
`applyPurchaseCredits`, `packageConfig`, חבילת popular, `grow-webhook`, וכל שאר הקבצים.

## הערה
כרגע כפתור "רכישת בדיקה" בעמוד ה-Upgrade מוצג לפי רשימת מיילים בצד הלקוח שכוללת `carmit1901+test@gmail.com` ו-`souldesign06@gmail.com`. אחרי השינוי, השרת יאשר רק את `shirley.u85@gmail.com` — כלומר לחיצה של שני המיילים האחרים תיכשל ב-403. השארתי את רשימת הלקוח כמות שהיא לפי ההנחיה "לא לגעת בשום דבר אחר בעמוד" — אפשר לעדכן אותה בנפרד אם רוצים.

## סעיף 3 (נפרד)
ההרצה החד-פעמית של 3 קריאות `verify-purchase` עם `testMode: true` ו-`packageId: "popular"` תתבצע רק אחרי שהמשפיענית נרשמת ויהיה לנו ה-`userId` שלה.
