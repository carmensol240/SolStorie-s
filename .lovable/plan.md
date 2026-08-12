# תיקון עמודי איור: full-bleed + הקטנת גודל קובץ PDF

## יעד
שינוי ממוקד בקובץ `src/hooks/use-pdf-export.ts`:
1. איורים שממלאים את כל עמוד ה-PDF (full-bleed) במקום "לצוף" במרכז עם שוליים לבנים.
2. הקטנת גודל קובץ ה-PDF על ידי מעבר מפורמט PNG ל-JPEG באיכות 0.92.

## מצב נוכחי (מאומת מקוד מקור)
- `renderIllustrationOnlyPage` משתמש ב-`padding: 80px` ובתמונה עם `object-fit: contain`.
- `captureHtmlToPage` ממירה את ה-canvas ל-`image/png` ומוסיפה ל-PDF כ-`'PNG'`.

## שינויים מתוכננים

### 1. Full-bleed לאיורים — `renderIllustrationOnlyPage`
- ישתנה ל-`padding: 0`.
- התמונה תקבל `object-fit: cover; width: 100%; height: 100%`.
- הפולבק (רקע קשת) יימתח גם הוא ל-`width: 100%; height: 100%`.

### 2. הקטנת גודל קובץ — `captureHtmlToPage`
- ישתנה `canvas.toDataURL('image/png')` ל-`canvas.toDataURL('image/jpeg', 0.92)`.
- ישתנה `pdf.addImage(imgData, 'PNG', ...)` ל-`pdf.addImage(imgData, 'JPEG', ...)`.

## מה לא נוגעים בו
- עמודי כריכה, הקדשה, טקסט וכריכה אחורית.
- רזולוציית ה-html2canvas (`scale: 2`) וגודל העמוד (2480×2480 px).
- לוגיקת יצירת איורים, אימות זכאות PDF, וקבצים אחרים.

## אימות
- הרצת typecheck (`tsgo` / `bunx tsc --noEmit`) לאחר השינוי.
- יצירת PDF לדוגמה ווידוא שאיורים ממלאים עמוד ושגודל הקובץ ירד לציפייה.
