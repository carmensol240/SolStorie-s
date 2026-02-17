

# אופטימיזציה ויזואלית - Skeleton Loading, Auto-Refresh, ועדכון טקסטים

## סקירה
שלושה שינויים עיקריים: (1) שדרוג תצוגת האיורים החסרים ל-Skeleton Loading יפה, (2) וידוא ש-Auto-Refresh של איורים עובד, (3) תיקון טקסטים כפולים במסך "generating_illustrations" ב-StoryViewer.

---

## שינויים מתוכננים

### 1. Skeleton Loading לאיורים (BookPage.tsx)
החלפת הריבוע הריק עם קו מקווקו (dashed border) באנימציית Skeleton מעוצבת:
- רקע מעומעם עם אנימציית pulse/shimmer
- אייקון מצייר מעומעם במרכז (Palette) עם טקסט "סול מציירת..."
- שמירה על אותו aspect-ratio (4/5) ועיצוב מסגרת

### 2. Auto-Refresh של איורים (StoryViewer.tsx)
המנגנון כבר קיים (pollForUpdates עם interval של 3 שניות). צריך לוודא שה-polling מתחיל גם כשהמשתמש לוחץ "התחילו לקרוא עכשיו" ולא רק במצב generating_illustrations. כרגע כשלוחצים על הכפתור, ה-state עובר ל-ready וה-polling נעצר. נתקן כך שה-polling ימשיך ברקע גם לאחר מעבר לקריאה, עד שכל האיורים מוכנים.

### 3. תיקון טקסטים במסך generating_illustrations (StoryViewer.tsx, שורות 700-724)
- **הסרה**: השורה "האיורים יופיעו בזמן שתקראו" (שורה 711-713)
- **עדכון תיבת הטיפ**: החלפת הטקסט הקיים בטקסט החדש: "טיפ: זה זמן מעולה להתכרבל יחד. הסיפור כבר מחכה לכם בפנים! (האיורים ימשיכו להיטען אוטומטית)"
- שמירה על מרווח מאוורר בין הכפתור לתיבת הטיפ

---

## פרטים טכניים

### BookPage.tsx - Skeleton Loading
החלפת הבלוק ב-else (שורות 52-63) שמציג border-dashed + BookOpen/spinner:
- אנימציית shimmer עם gradient נע (animate-pulse של Tailwind)
- רקע בגוון חם (#F5E6D3) עם gradient מעומעם
- אייקון Palette במרכז עם opacity נמוך
- טקסט "סול מציירת..." מתחת לאייקון

### StoryViewer.tsx - Polling ברקע
- כשהמשתמש לוחץ "התחילו לקרוא", במקום לשנות את generationStatus ל-ready, פשוט לעבור למצב קריאה (setCurrentPage(-1)) בלי לעצור את ה-polling
- ה-polling כבר מעדכן את story.pages עם איורים חדשים, כך שהם יופיעו אוטומטית

### StoryViewer.tsx - טקסטים (שורות 700-724)
- הסרת שורות 711-713 (הטקסט "האיורים יופיעו בזמן שתקראו")
- עדכון שורות 717-721 לטקסט החדש עם margin-top מספיק

### קבצים שישתנו
- `src/components/story/book-frame/BookPage.tsx`
- `src/pages/StoryViewer.tsx`

### קבצים שלא ישתנו (נעילה)
- Slugs, Admin (999), Footer PDF, מנגנון היפוך כרטיסיות

