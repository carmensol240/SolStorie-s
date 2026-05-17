## שני שינויים מצומצמים ב-StoryViewer

### 1. לוגו SolStorie's — לחיץ עם אייקון 🔗 בעמודי הסיפור בלבד

**מצב נוכחי:** במסכים פנימיים (Home, Library, Settings, ChildInfoStep, GlobalFooter, GuestLanding) הלוגו כבר רנדור כ-`<span>`/`<h1>` רגיל — לא לחיץ. אין צורך לשנות שם.

הלוגו הלחיץ היחיד הוא ב-`src/pages/StoryViewer.tsx` (שורות 1789-1799) — `<a href="https://soulstory.co.il">` שמופיע על כל עמודי הסיפור (כריכה, עמודי איור, עמוד סיום, עמוד פרידה).

**שינוי:** להוסיף אייקון `Link2` קטן (lucide-react) ליד הטקסט בקישור הזה, ולהשאיר את שאר ההתנהגות (target=_blank, opacity-60 hover:opacity-100).

```tsx
<a href="https://soulstory.co.il" target="_blank" rel="noopener noreferrer"
   className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
   aria-label="SolStorie's - פתח באתר">
  <Link2 className="w-3 h-3 text-purple-600" />
  <span className="text-[11px] font-black logo-3d-bubble">
    <span className="logo-rainbow">SolStorie's™</span>
  </span>
</a>
```

### 2. מסך הסיום — הסרת כפילות + שינוי כפתור צהוב

**הסרת לוגו כפול במסך הסיום (End Page):**
ב-`src/pages/StoryViewer.tsx` שורות 1524-1527 יש בלוק `{/* Logo footer */}` עם לוגו לא-לחיץ שמופיע בנוסף ללוגו הלחיץ של הפוטר הגלובלי. נמחק את הבלוק הזה — נשאר רק הלחיץ עם 🔗.

**שינוי כפתור צהוב במסך הפרידה (Closing Page):**
שורות 1443-1448 — כפתור `לדף הסיום ✨`. נשנה את התווית ל-`לדפי הצביעה 🎨` (אייקון Palette מ-lucide-react). הפעולה `handlePageNav('next')` נשארת — היא ממילא מובילה למסך הסיום שמכיל את כפתורי הצביעה.

```tsx
<Button
  onClick={() => handlePageNav('next')}
  className="bg-gradient-to-r from-amber-400 to-yellow-500 ... gap-2 animate-bounce-gentle mt-2"
>
  <Palette className="w-5 h-5" />
  לדפי הצביעה
</Button>
```

### קבצים שמשתנים
- `src/pages/StoryViewer.tsx` בלבד (3 hunks + הוספת import ל-`Link2, Palette`).

### לא משתנה
- שום קובץ אחר. אין שינוי ב-Settings/Library/Home/ChildInfoStep/GlobalFooter — הלוגואים שם כבר לא לחיצים.
- אין שינוי ב-PublicStoryViewer (מסך ציבורי לסיפורים משותפים, לא מסך פנימי).
- אין שינוי בלוגיקה, בניתוב, או ב-DB.
