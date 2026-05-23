## תיקונים

### 1. פופאפ רכישה מבצבץ (`StoryViewer.tsx`)
הבעיה: `?paywall=1` פותח את `DemoLockModal` באופן מיידי, לפני שבדיקות הרכישה (purchases/subscriber/admin) הסתיימו. אצל מי שרכש — הפופאפ מבצבץ עד שהבדיקה מסתיימת.

תיקון:
- הוספת state `purchaseChecksReady` (boolean). מתחיל `false`, מתעדכן ל-`true` רק לאחר שכל 3 הבדיקות (`refetchPurchaseStatus`, subscriber, admin) סיימו.
- ב-`useEffect` של `?paywall=1`: לדחות את `setDemoLockOpen(true)` עד `purchaseChecksReady && isDemoUser`.
- גם `setDemoLockOpen(true)` שב-`guardDemo` נשאר ידני (קליק משתמש), אז לא מושפע.

### 2. שני כפתורי וואטסאפ (`StoryViewer.tsx` שורות 1540-1550)
הבעיה: כפתור וואטסאפ קיים גם ב-`BookHeader` (שורה 1512) וגם כאייקון צף בפינה השמאלית-עליונה של העמוד.

תיקון: הסרת הכפתור הצף (שורות 1540-1550). משאיר רק את כפתור ה-Header.

### 3. "🎁 נוסף בחינם" כפול
הבעיה: השורה מופיעה גם ב-`DemoLockModal` (שורה 106) וגם ב-`Upgrade.tsx` (שורה 457).

תיקון: הסרה מ-`DemoLockModal` (השארת ההודעה הגדולה בעמוד Upgrade עצמו, שם הרכישה מתבצעת).

### 4. חזרה ל-Upgrade — נחיתה על עמוד נעול (`StoryViewer.tsx`)
הבעיה: בשחזור עמוד מ-`storyReturnPage`/`pendingStoryReturn`, אם המשתמש עדיין דמו (סגר את Upgrade ללא רכישה), הוא נוחת על עמוד שמעל `DEMO_PAGE_LIMIT` (3).

תיקון: ב-`useEffect` של שחזור עמוד (~שורה 480), לאחר חישוב `n`, אם `purchaseChecksReady && isDemoUser`, להגביל: `n = Math.min(n, DEMO_PAGE_LIMIT - 1)` (אינדקס 0-based). כך הוא נוחת על העמוד האחרון הפתוח לדמו. נוסיף את `isDemoUser` ו-`purchaseChecksReady` כתלויות, ונפעיל את ה-restore רק כשהבדיקות סיימו.

## ללא שינויים
לא נוגעים ב-RLS, edge functions, רשת או לוגיקה אחרת. שינויים פרונט-אנד בלבד בשני קבצים: `src/pages/StoryViewer.tsx` ו-`src/components/story/DemoLockModal.tsx`.