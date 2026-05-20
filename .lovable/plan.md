## החלפת FlippingBookAnimation במוקאפ הספר החדש

ה-HTML שהעלית הוא **מוקאפ של ספר יחיד** (לא אנימציית התהפכות) – שדרה סגולה משמאל, כריכה אחת עם תמונת base64 מוטמעת, overlay כהה בתחתית עם כותרת/subtitle/לוגו, ותגית `✨ SolStorie's™` בפינה. אחליף את הקומפוננטה הקיימת בדיוק לפי העיצוב הזה.

### מה ניצור / נשנה

1. **`src/assets/sol-vet-cover.jpg`** – חילוץ תמונת ה-base64 מתוך ה-HTML ושמירה כקובץ JPG אמיתי (לבאנדל יעיל, במקום base64 ענק בקוד).

2. **`src/components/upgrade/FlippingBookAnimation.tsx`** – החלפה מלאה: רינדור של "scene" יחיד – `spine` (שדרה סגולה אנכית עם הטקסט `סול רופאת החיות · SolStorie's™`) + `book` (תמונת הכריכה ב-`object-cover`) + `overlay` gradient בתחתית עם:
   - כותרת: **"סול רופאת החיות"** (לבן, מודגש)
   - subtitle: **"הסיפור של סול"** (זהב `#ffd166`)
   - לוגו: `SolStorie's™ · soulstory.co.il` (לבן שקוף)
   - `badge` בפינה עליונה-ימנית: `✨ SolStorie's™`
   - מתחת לסצנה: caption קטן `📖 ספר ילדים מותאם אישית · A5 · כריכה קשה · צבעוני`
   
   ללא state, ללא setInterval, ללא dots – זה מוקאפ סטטי. שמירה על `dir="rtl"`, `aria-hidden="true"`, ותמיכה ב-`prefers-reduced-motion`.

3. **`src/components/upgrade/flipping-book.css`** – החלפת ה-CSS למחלקות שתואמות ל-HTML החדש (`fba-scene`, `fba-spine`, `fba-spine-text`, `fba-book`, `fba-cover-img`, `fba-overlay`, `fba-title`, `fba-subtitle`, `fba-logo-text`, `fba-badge`, `fba-caption`) עם הצללה רכה (`drop-shadow`), `writing-mode: vertical-rl` לטקסט בשדרה, ו-gradient ל-overlay זהה למקור. מידות מותאמות (רוחב ~316px, גובה 400px) כך שיתאים גם למובייל.

### מה לא נשנה

- `src/pages/Upgrade.tsx` – הקומפוננטה כבר משובצת שם, אין צורך לגעת.
- שום קובץ אחר. אין שינויי לוגיקה עסקית / תמחור / PayPal / מסד נתונים.

### הערה
התמונה הוסיפה ב-base64 ל-HTML מתארת את העטיפה של "סול רופאת החיות" – נשתמש בה כפי שהיא. אם תרצה להחליף בעתיד לכריכות אחרות / מתחלפות (קרוסלה אמיתית) – נעשה את זה בצעד נפרד.
