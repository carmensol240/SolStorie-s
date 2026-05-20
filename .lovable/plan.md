## מטרה
להסיר את תיבת בחירת הפורמט מלחצן הורדת ה-PDF ולהשאיר כפתור הורדה יחיד שמפעיל ישירות את הפורמט הריבועי.

## שינויים

### 1. `src/pages/StoryViewer.tsx`
- **הסרת מצב תיבת דו-שיח:** מחיקת `showPdfFormatDialog` ו-`setShowPdfFormatDialog`.
- **שינוי פעולת לחצן ההורדה:** `onDownload` יקרא ישירות ל-`exportToPdf(story)` במקום לפתוח תיבת דו-שיח.
- **הסרת תיבת דו-שיח PDF:** מחיקת כל בלוק ה-AlertDialog של "בחר פורמט PDF" (שתי האפשרויות וכפתור הביטול).
- **עדכון שיתוף:** קריאה ל-`generatePdfFile(story)` ללא פרמטר `layout`.
- **ניקוי יבואים:** הסרת `FileDown` (משמש רק בתיבת הדו-שיח).

### 2. `src/hooks/use-pdf-export.ts`
- **הסרת טיפוס לא בשימוש:** מחיקת `PdfLayout`.
- **פישוט חתימות פונקציות:** `buildPdf`, `exportToPdf`, `generatePdfFile`, ו-`makePdfFileName` יקבלו רק את אובייקט הסיפור ללא פרמטר `layout`.
- **שם קובץ אחיד:** `makePdfFileName` ישתמש תמיד בקידומת `SoulStory_` (הפורמט הריבועי).

## מה לא משתנה
- תצוגת הסיפור באפליקציה
- BookHeader – רק פעולת ה-onDownload שלו תשתנה
- כל שאר הדיאלוגים והפונקציות ב-StoryViewer