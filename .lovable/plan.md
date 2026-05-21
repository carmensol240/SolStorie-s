## הגבלת סיפור לדוגמא ל-3 עמודים ראשונים

### לוגיקה
משתמש שמוגדר `isDemoUser` (מהקוקיה הקיימת `useIsDemoUser` שהוספנו לפני, ללא רכישה וללא subscriber) — נחסום צפייה החל מהעמוד הרביעי של הסיפור (`dbPage.page_number > 3`). משתמש עם רכישה — ללא שינוי.

### שינויים ב-`src/pages/StoryViewer.tsx`

#### 1. חישוב גבול ה-paywall
- שימוש בערך הקיים `guardDemo` / `isDemoUser` שכבר זמינים בקומפוננטה.
- קבועים: `DEMO_PAGE_LIMIT = 3` (מספר עמודי DB מותרים).
- `isLockedVirtualPage(virtualIndex)` — מחזיר `true` אם המשתמש דמו ו-`virtualPages[virtualIndex].dbPage.page_number > 3`.

#### 2. חסימת ניווט קדימה
ב-`handlePageNav('next')`:
- אם המעבר הבא יוביל ל-virtual page שמסומן locked → לא לקדם את `setCurrentPage`. במקום זה לפתוח את `DemoLockModal` הקיים (`setDemoLockOpen(true)`).
- חיצי ניווט (`disabled`) — להוסיף תנאי: אם העמוד הבא נעול → להשאיר את החץ פעיל אבל הקליק יפתח את המודאל (כדי שהיוזר יראה שיש המשך).
- חסימה גם של גלילה/swipe אם קיימת בקריאות `handlePageNav`.

#### 3. הצגת Overlay במקום תוכן העמוד הנעול
במידה ובכל זאת `currentPage` הגיע לעמוד נעול (edge case של דילוג/דיפ-לינק):
- בתוך הרינדור של `isContentPage`, אם `isLockedVirtualPage(currentPage)` → להחליף את תוכן ה-virtual page (גם בענפי `illustration`/`text`/`combined`) בקומפוננטת overlay:
  - רקע: שכבת blur כהה (`backdrop-blur-md bg-black/70`) שמכסה את אזור העמוד.
  - תוכן ממורכז:
    - אייקון/אימוג'י `✨`
    - כותרת: `רוצים לקרוא את הסיפור המלא?`
    - תיאור: `רכשו חבילת סיפורים`
    - כפתור primary: `לרכישת חבילה` → `navigate('/upgrade')`
  - דיר RTL, צבעים בהתאם ל-design tokens של הסיפור (סגול/ורוד/לבן כמו `DemoLockModal`).
- מתחת ל-overlay אפשר להציג רמז של תוכן העמוד מטושטש (אופציונלי — נשתמש ב-`filter blur-lg opacity-40` על תוכן ה-virtual page המקורי לקבלת אפקט teaser).

#### 4. אינדיקטור עמודים
ב-`{currentPage + 1} / {virtualPages.length}` — להשאיר כמות מלאה (לא להסתיר אורך) כדי שהיוזר יראה כמה תוכן מחכה.

#### 5. פעולות חסומות בעמוד הנעול
כל הפעולות כבר עטופות ב-`guardDemo` ולכן ימשיכו לפתוח את המודאל הקיים — אין צורך בשינוי נוסף.

### מה לא משתנה
- הלוגיקה של `useIsDemoUser`, `DemoLockModal`, מערכת הקרדיטים, הספרייה, ה-PDF, וצפיית משתמש עם רכישה.
- מבנה `virtualPages`, ההפרדה איור/טקסט, סגנון הספר.
- כל קובץ אחר במערכת.
