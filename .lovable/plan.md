# תיקון Preview שנתקע על גרסה ישנה

## הבעיה

הפרויקט משתמש ב-`vite-plugin-pwa` עם `registerType: "autoUpdate"` ו-`registerSW({ immediate: true })` ללא שום הגנה.
ה-Service Worker נרשם גם בתוך ה-iframe של Preview של Lovable וגם בדומיין `lovable.app`, ומגיש HTML מה-cache במקום מהשרת.
התוצאה: כל שינוי קוד "לא מתעדכן" בעיני המשתמש עד hard refresh ידני.

המשתמש בחר להשאיר את האופליין פעיל בפרודקשן (`soulstory.co.il`), אז הפתרון הוא להשאיר את ה-PWA חי, אבל לחסום אותו בסביבת Preview ולהפסיק להגיש HTML מ-cache.

## מה אשנה

### 1. `src/main.tsx` — Guard סביב registerSW
- לא לרשום SW כשהאפליקציה רצה בתוך iframe.
- לא לרשום SW על דומייני Preview של Lovable (`id-preview--*.lovable.app`, `*.lovableproject.com`).
- בסביבות האלה — להפעיל ניקוי: `unregister()` לכל SW קיים + `caches.delete()` לכל ה-caches, כדי לנקות מכשירים שכבר תפסו את ה-SW הישן.

### 2. `vite.config.ts` — Workbox בטוח יותר
- להוסיף `devOptions: { enabled: false }` (SW רק ב-build production).
- להוסיף `runtimeCaching` עבור navigations: `NetworkFirst` עם `networkTimeoutSeconds: 3` ו-`cacheName: "html"`. כך HTML תמיד מנסה רשת קודם, ורק אם אין רשת — נופל ל-cache. זה הסעיף המרכזי שמונע "תקיעה על גרסה ישנה".
- להשאיר את הגדרות הפונטים הקיימות.
- להשאיר `registerType: "autoUpdate"` כדי שגרסאות חדשות יתפסו אוטומטית.

### 3. ללא נגיעה בלוגיקה הקיימת
- לא לגעת ב-`PWAInstallPrompt`, `PWAInstallBanner`, `InstallAppPrompt`, `use-pwa-install` — הם רק מאזינים ל-`beforeinstallprompt` ולא רושמים SW.
- לא לגעת ב-Manifest, אייקונים, או הגדרות PayPal/CSP.
- לא לשנות באנדים בפרודקשן — האפליקציה תמשיך להיות מותקנת כ-PWA ולעבוד אופליין ב-`soulstory.co.il`.

## למה זה ימנע חזרה של הבעיה

- ב-Preview של Lovable: אין יותר SW בכלל, אז אין שכבת cache בין הקוד החדש לבין מה שהמשתמש רואה.
- בפרודקשן: ה-HTML תמיד נטען עם `NetworkFirst`, כך שגרסה חדשה אחרי `Publish` נראית מיד; ה-`autoUpdate` של ה-plugin מחליף את ה-SW ברקע.
- ניקוי חד-פעמי: משתמשים שכבר תפסו את ה-SW הישן בתוך ה-Preview יקבלו `unregister` + מחיקת caches בטעינה הבאה.

## עדכון Memory

להוסיף ל-Core של `mem://index.md`:
> "PWA disabled in Lovable Preview/iframe. Production uses NetworkFirst for HTML navigations to prevent stale-cache lock-in."

ולקובץ חדש `mem://constraints/pwa-preview-guard` עם הפרטים המלאים, כדי שזה לא יחזור על עצמו בעתיד.
