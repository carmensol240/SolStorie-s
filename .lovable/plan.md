

## תיקון הבהוב מסך ריק בספרייה

### הבעיה
כשנכנסים לספרייה (למשל מכפתור "חזרה לספרייה" בסוף סיפור), ה-`user` מתחיל כ-`null`. זה גורם ל-`fetchStories` לסיים מיד עם `stories=[]` ו-`isLoading=false`, מה שמציג את ה-**EmptyState** (התמונה של בן וסול). רגע אחרי, ה-`user` מתעדכן, ה-fetch רץ שוב עם הסיפורים האמיתיים, ומופיעה הספרייה הרגילה.

### הפתרון
בקובץ `src/pages/Library.tsx`:

1. **לא להציג תוכן עד שה-user נטען** — כל עוד `user` הוא `undefined`/`null` ו-auth עדיין בטעינה, להציג את ה-`LoadingSkeleton` במקום ה-EmptyState
2. שינוי התנאי בשורה 275: במקום `stories.length === 0` ישר להציג EmptyState, לבדוק גם ש-`user` כבר נטען (לא `undefined`) ושה-loading סיים

שינוי קטן — שורה אחת בלוגיקת התנאי:
```tsx
{isLoading || !user ? (
  <LoadingSkeleton />
) : stories.length === 0 ? (
  <EmptyState ... />
) : ...}
```

### קובץ אחד
`src/pages/Library.tsx`

