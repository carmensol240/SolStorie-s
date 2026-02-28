

## תיקון ניווט ועיצוב צבעוני

### שינויים בקובץ `src/pages/StoryViewer.tsx`

**1. הסרת אנימציית הדפדוף התלת-ממדית**
- הסרת states: `flipPhase`, `flipDirection` (שמירת `isFlipping` בלבד)
- פישוט `handlePageNav`: מעבר ישיר ללא שלבי animation — רק `isFlipping=true` → שינוי עמוד → `isFlipping=false` (300ms fade פשוט)
- הסרת CSS classes מה-page container: `book-page-flip`, `flip-out-next`, `flip-in-next`, `flip-out-prev`, `flip-in-prev`
- שימוש באנימציית fade פשוטה (`opacity + transition`) במקום

**2. עיצוב חיצים בצבעי קשת**
- החלפת `.nav-arrow-btn` מסגול חד-צבעי לגרדיאנט קשת (purple→pink→orange) עם גודל 56x56px
- הוספת `background: linear-gradient(135deg, #9333ea, #ec4899, #f97316)` לחיצים עם טקסט לבן
- שמירת disabled state ו-hover effects

**3. הסרת מרכוז אנכי בדף ההקדשה**
- שינוי `justify-center` ל-`justify-start pt-12` בדף ההקדשה (שורה 973)

### שינויים בקובץ `src/pages/StoryViewer.css`

- הסרת/השבתת keyframes של `page-flip-out-*` ו-`page-flip-in-*` (שמירתם כ-comment למקרה הצורך)
- עדכון `.nav-arrow-btn` לגרדיאנט קשת, גודל 56px, צבע לבן לאייקונים

### מה לא משתנה
- סדר דפים (cover → dedication → content → closing → end) — כבר נכון
- פריסת איורים full-width — כבר נכון
- שפה עברית — כבר נכון
- יישור top-aligned בדפי תוכן — כבר נכון
- מבנה 2 דפים (איור+טקסט, טקסט בלבד) — כבר נכון

