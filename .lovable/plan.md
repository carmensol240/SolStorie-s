

# עדכון כפתור "אודות" והסרת כפילות

## השינויים הנדרשים

### שינוי 1: עדכון טקסט הכפתור (שורה 135)
לשנות את הטקסט בכפתור מ-"אודות" ל-"אודות StoryTime"

**לפני:**
```tsx
<span className="font-medium text-sm text-foreground">אודות</span>
```

**אחרי:**
```tsx
<span className="font-medium text-sm text-foreground">אודות StoryTime</span>
```

### שינוי 2: הסרת StoryTime הכפול מהדיאלוג (שורות 179-183)
להסיר את הבלוק הזה לגמרי כי StoryTime כבר מופיע בכותרת הדיאלוג:

```tsx
// למחוק את זה:
<div className="text-center mb-4">
  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
    StoryTime
  </span>
</div>
```

---

## התוצאה הסופית

**כפתור בתפריט:** "אודות StoryTime"

**כותרת הדיאלוג:** "📖 להפוך את הקושי לסיפור קסום – StoryTime ✨" (נשארת כמו שהיא)

**תוכן הדיאלוג:** מתחיל ישירות עם הפסקה הראשונה - "כאימא יחידנית לילדה על הרצף..."

---

## קובץ לעדכון

| קובץ | סוג שינוי |
|------|-----------|
| `src/pages/Settings.tsx` | עדכון טקסט כפתור + הסרת כפילות |

