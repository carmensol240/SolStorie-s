# הוספת Meta Pixel (2132057870988224)

## מה ייבנה

1. **קוד בסיס בראש הדף** — הוספת סקריפט Meta Pixel סטנדרטי ל-`<head>` ב-`index.html`, כולל אתחול עם המזהה `2132057870988224` ו-`PageView` ראשוני, וכן `<noscript>` עם תמונת fallback ב-`<body>` (לא ב-head, לפי תקן HTML).

2. **עדכון מדיניות האבטחה (CSP)** — ה-`Content-Security-Policy` הקיים ב-`index.html` חוסם היום דומיינים חיצוניים. בלי עדכון, הפיקסל פשוט לא ייטען. יתווספו:
   - `script-src`: `https://connect.facebook.net`
   - `img-src`: כבר מאפשר `https:` (תקין)
   - `connect-src`: `https://www.facebook.com`

3. **מעקב אחרי מעבר בין עמודים** — קומפוננטה חדשה `src/components/MetaPixel.tsx` שמאזינה לשינוי נתיב (React Router `useLocation`) ושולחת `fbq('track','PageView')` בכל מעבר. כדי למנוע ספירה כפולה בטעינה הראשונה (ה-PageView כבר נורה ב-head), הקומפוננטה תדלג על הרינדור הראשון.

4. **חיבור לאפליקציה** — הוספת `<MetaPixel />` בתוך ה-`BrowserRouter` ב-`src/App.tsx`, לצד `ScrollToTop` ו-`PageTitle`.

## פרטים טכניים

- `window.fbq` יוגדר עם טיפוס גלובלי מינימלי כדי לשמור על תקינות TypeScript.
- הקומפוננטה תיכשל בשקט אם `fbq` לא קיים (למשל חסימת פרסומות) — ללא שגיאות בקונסול.
- לא ייעשה שינוי בלוגיקה עסקית או ב-GA4 הקיים; שני הכלים ירוצו במקביל.
