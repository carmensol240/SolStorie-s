

## שינוי פריסה: איור ברוחב מלא + טקסט מתחת בכל דף

### מצב נוכחי
הסיפור מחולק ל-virtual pages: דפי טקסט נפרדים ודפי איור נפרדים. בתצוגה סטנדרטית — 2 דפי טקסט ואז דף איור. בגיל 0-2 — דף טקסט ואז דף איור.

### שינוי מבוקש
כל דף יהיה **משולב**: איור גדול (60%+ מגובה הדף, רוחב מלא ללא שוליים) + טקסט מתחתיו. אין יותר דפים נפרדים.

### שינויים — `src/pages/StoryViewer.tsx`

#### 1. שינוי מבנה VirtualPage
סוג אחד בלבד — כל virtual page כולל גם טקסט וגם איור:
```
type VirtualPage = { 
  dbPage: StoryPage; 
  illustrationUrl: string | null; 
  illustrationPrompt: string | null; 
}
```

#### 2. שינוי לוגיקת בניית virtualPages
כל DB page הופך ל-virtual page אחד (1:1). אין יותר חלוקה ל-text/illustration:
```typescript
for (const page of dbPages) {
  result.push({
    dbPage: page,
    illustrationUrl: page.illustration_url,
    illustrationPrompt: page.illustration_prompt || null,
  });
}
```

#### 3. שינוי ה-JSX של דפי התוכן (שורות ~1148-1207)
פריסה חדשה לכל דף:
- **איור** — `flex-[6]`, `w-full`, `object-cover` (ללא padding/margin) — ממלא 60%+ מהדף ברוחב מלא
- **טקסט** — `flex-[4]`, רקע חם, עם גלילה אם צריך
- אם אין illustration_url אבל יש prompt — skeleton
- אם אין גם prompt — placeholder דקורטיבי (רקע צבעוני + אמוג'י)

#### 4. עדכון totalVirtualPages
כמות ה-virtual pages תהיה בדיוק כמספר דפי ה-DB (במקום מספר משתנה).

### קובץ אחד
`src/pages/StoryViewer.tsx`

