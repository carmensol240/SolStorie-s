## תיקון מסך הסיום ב-StoryViewer (Closing Page) למובייל

**קובץ יחיד:** `src/pages/StoryViewer.tsx` — בלוק `isClosingPage` (שורות ~1396–1430). שאר הקובץ והעיצוב לא משתנים.

### הבעיה (כפי שמופיעה בצילום במסך 320px)
הכותרת `✨ סוף – נתראה בסיפור הבא! ✨` ממוקמת `absolute inset-0` ומרכזית, וקופסת התוכן התחתון (לוגו צבעוני `SolStorie's™ | soulstory.co.il` + כפתורים) גם היא ב-`z-10` ועולה עליה — וכך הלוגו "חוצה" את שורת הכותרת באמצע המסך.

### השינויים (ממוקדים, ללא שינוי דיזיין/צבעים/לוגיקה)

1. **מיכל הסיום — `overflow-hidden` ו-flex column אנכי תקין**
   - על העטיפה החיצונית (`<div className="relative flex-1 flex flex-col items-center justify-end ...">`) להוסיף `overflow-hidden` כדי שכלום לא יחרוג מהפינות המעוגלות.

2. **שכבת הכותרת — RTL + ריווח צדדי + פונט רספונסיבי + z-index גבוה יותר**
   - על ה-`<div className="absolute inset-0 z-10 flex items-center justify-center px-6 pointer-events-none">`:
     - לשנות `z-10` → `z-20`.
     - להחליף `px-6` → `px-4 sm:px-6` (כך שב-320px הטקסט לא נוגע בקצוות).
   - על ה-`<p>` של הכותרת:
     - להוסיף `dir="rtl"` (כבר קיים) + `style={{ textAlign: 'center' }}` נשמר; להוסיף `leading-tight break-words max-w-[90%] mx-auto`.
     - להוריד פונט במובייל: `text-xl sm:text-2xl md:text-4xl` במקום `text-2xl md:text-4xl`.

3. **שכבת הלוגו והכפתורים — להוריד עדיפות מעל הכותרת**
   - על `<div className="relative z-10 space-y-3 pb-8 px-6">`:
     - `z-10` → `z-10` נשאר אך הכותרת תהיה `z-20` כך שלא תוסתר.
     - `px-6` → `px-4 sm:px-6`.
   - על ה-`<a>` של הלוגו: להוסיף `style={{ opacity: 0.85 }}` ולגלוף את הטקסט הצבעוני ב-`<span>` עם `dir="ltr"` (כבר נשמר) + `whitespace-nowrap` כדי שלא יישבר.
   - על ה-`Link2` icon: ללא שינוי.

4. **מדיה-קוורי קטן ב-`@media (max-width: 480px)`** — להוסיף ב-`src/pages/StoryViewer.css` כלל יחיד שמקטין את הלוגו הצבעוני במסך הסיום:
   ```css
   @media (max-width: 480px) {
     .logo-3d-bubble { font-size: 1rem !important; }
   }
   ```
   (מצמצם את ה-`text-xl` במובייל הקטן, מונע חזרה לעלות על הכותרת.)

### מה לא משתנה
- הצבעים, ה-`logo-rainbow`, ה-`logo-3d-bubble`, התמונה הרקעית `castWavingFarewell`, ה-overlay הכהה, כפתורי "המשיכו לחלק" / "חזרה לספרייה", ושאר ה-StoryViewer.
- אין שינוי בלוגיקה, ב-routing או ב-Edge Functions.

### בדיקה
- במובייל 320×544 וב-iPhone SE: הכותרת ממורכזת, לא נחתכת בקצוות, והלוגו הצבעוני יושב למטה בלי לחפוף אותה.
- בדסקטופ/טאבלט: ללא שינוי ויזואלי מורגש.
