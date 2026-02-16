

# תיקון Footer ב-PDF - עיצוב מקצועי עם צבע וקישור

## מה ישתנה

הפונקציה `addWatermark` בקובץ `src/hooks/use-pdf-export.ts` תעודכן כך:

1. **טקסט חדש**: מ-"SolStorie's™ | כל הזכויות שמורות" ל-"SolStorie's™ | עולמה הקסום של סול"
2. **צבע סגול מותגי**: המילה SolStorie's™ תוצג בסגול (#9333ea) ובמודגש (bold)
3. **קישור לאתר**: מתחת לכותרת יופיע הקישור https://soulstory.co.il בצבע כחול, לחיץ ב-PDF
4. **יישור RTL ומרכוז**: direction: rtl עם padding-bottom: 20px למניעת חיתוך

## פרטים טכניים

### קובץ: `src/hooks/use-pdf-export.ts`
שינוי הפונקציה `addWatermark` (שורות 74-85):

- שימוש ב-`pdf.setFont("Helvetica", "bold")` + `pdf.setTextColor(147, 51, 234)` (סגול מותגי) לכתיבת "SolStorie's™"
- חזרה לפונט רגיל + צבע אפור לכתיבת "| עולמה הקסום של סול"
- הוספת שורת קישור עם `pdf.textWithLink()` בצבע כחול (#2563eb) לכתובת https://soulstory.co.il
- מיקום ה-Footer ב-`pageHeight - 20` (במקום `pageHeight - 5`) להבטחת padding-bottom

### מה לא ישתנה
- אף מסך באפליקציה (UI)
- Slugs קיימים
- הרשאות Admin (999)
- 4 הנושאים החדשים
- טיפים של הפיה
- מבנה ה-PDF (cover, spreads, illustrations)

