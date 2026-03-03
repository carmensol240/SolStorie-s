

## תוכנית: הסרת אישור תנאים אוטומטי מתהליך ההרשמה

### הבעיה
בפונקציה `handleEmailSignUp` בקובץ `src/pages/Auth.tsx` (שורות 387-393), יש קוד שמעדכן `terms_accepted_at` מיד אחרי הרשמה — לפני שהמשתמש ראה את מסך ההסכמה. זה עוקף את מסך ה-Onboarding.

### מה ישתנה
**קובץ: `src/pages/Auth.tsx`**
- מחיקת שורות 386-393 (הבלוק שמעדכן `terms_accepted_at` ו-`terms_version` בטבלת profiles).
- שמירה על `processReferral` וכל הקוד שסביב.

### התוצאה
אחרי הרשמה, `terms_accepted_at` יישאר `null` → `RequireTerms` יזהה שאין אישור → המשתמש יועבר ל-`/onboarding` לאשר תנאים לפני כניסה לאפליקציה.

