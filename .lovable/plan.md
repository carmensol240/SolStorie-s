

## שינוי פריסה: איור fullscreen + טקסט כ-overlay שקוף

### שינויים ב-`src/pages/StoryViewer.tsx`

#### 1. פריסת דף תוכן חדשה (שורות ~1116-1178)
במקום הפריסה הנוכחית של `flex-[6]` (איור) + `flex-[4]` (טקסט), כל דף יהיה:
- **איור fullscreen** — `absolute inset-0 w-full h-full object-cover` ממלא 100% מהדף
- **Gradient overlay** — `bg-gradient-to-t from-black/70 via-black/30 to-transparent` בתחתית
- **טקסט** — מוצג כ-overlay שקוף בתחתית הדף (כמו בכריכה), טקסט לבן עם `drop-shadow`

#### 2. איחוד טקסטים לגיל 0-2 (שורות ~793-800)
שינוי לוגיקת בניית `virtualPages`:
- אם `age_range` הוא `0-2`: כל שני DB pages מתאחדים ל-virtual page אחד — הטקסטים מחוברים, האיור נלקח מהעמוד הראשון מהזוג
- לשאר הגילאים: 1:1 כרגיל

```typescript
if (isToddler) {
  for (let i = 0; i < pages.length; i += 2) {
    const p1 = pages[i];
    const p2 = pages[i + 1];
    const combinedText = p2 ? `${p1.text}\n${p2.text}` : p1.text;
    result.push({
      dbPage: p1,
      combinedText,
      illustrationUrl: p1.illustration_url,
      illustrationPrompt: p1.illustration_prompt || null,
    });
  }
}
```

#### 3. עדכון VirtualPage type
הוספת שדה `combinedText?: string` — כשקיים, משתמשים בו במקום `dbPage.text`

### קובץ אחד
`src/pages/StoryViewer.tsx`

