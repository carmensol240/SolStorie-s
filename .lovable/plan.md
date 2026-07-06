# הוספת אימייל בדיקה נוסף לזרימת test purchase

## שינוי יחיד

**`src/pages/Upgrade.tsx`** (שורות 5 ו-124):

- להחליף את הקבוע היחיד `WHITELISTED_TEST_EMAIL` ברשימה:
  ```ts
  const WHITELISTED_TEST_EMAILS = [
    "carmit1901+test@gmail.com",
    "souldesign06@gmail.com",
  ];
  ```
- לעדכן את בדיקת `isTestUser` (שורה 124) כך שתשווה מול הרשימה:
  ```ts
  const isTestUser = !!user?.email &&
    WHITELISTED_TEST_EMAILS.includes(user.email.toLowerCase());
  ```

## מה זה נותן

משתמשת שמתחברת עם `souldesign06@gmail.com` תראה את כפתור "🧪 רכישת בדיקה" ב-`/upgrade` ותוכל להריץ את זרימת ה-test purchase (סטטוס `test_completed` + בונוס 1+1) בלי חיוב.

## מה לא משתנה

- לוגיקת ה-Edge Functions (`verify-purchase`, `grant-first-purchase-bonus`) — נשארת זהה.
- מגבלת פעם-אחת של הבונוס נשארת בתוקף; לבדיקה חוזרת יש לאפס `first_purchase_bonus_given` ב-DB.
- אין השפעה על משתמשים אחרים.
