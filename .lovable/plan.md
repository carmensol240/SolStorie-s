

# שדרוג מסך קריאת הסיפור - חוויית ספר ילדים קסום

## סקירה
עיצוב מחדש של מסך הקריאה (StoryViewer) כך שירגיש כמו ספר ילדים אימרסיבי: איור גדול למעלה עם מעבר רך לטקסט, ניווט בהחלקה בלבד עם אינדיקטור נקודות, אפקט שימר בזמן טעינה, וטיפוגרפיה מותאמת לילדים.

---

## 1. מבנה עוטף (Immersive Layout)

**מצב נוכחי:** פריסת "ספר פתוח" - איור בצד ימין, טקסט בצד שמאל (דסקטופ), או איור למעלה וטקסט למטה (מובייל) עם הפרדה ברורה.

**שינוי:** מעבר לפריסה אנכית אחידה בכל המכשירים:
- האיור תופס כ-60% מגובה המסך הנראה, מוצג edge-to-edge (ללא מסגרת/border)
- מתחת לאיור, gradient fade שקוף-לקרם שיוצר מעבר רך
- הטקסט מופיע על רקע קרם חם (`#FFFBF5`) מתחת לגרדיאנט
- הסרת מסגרת הספר (BookFrame) והחלפתה בקונטיינר פשוט ונקי
- כל "עמוד" (spread) מוצג כמסך מלא עם גלילה אנכית אם הטקסט ארוך

**קבצים:** `src/pages/StoryViewer.tsx`

---

## 2. ניווט ללא חיצים

**מצב נוכחי:** חיצי ניווט צפים בצדדים (NavigationArrows) + swipe כבר פעיל.

**שינוי:**
- הסרת רכיב `NavigationArrows` מתוך ה-render של StoryViewer
- ה-swipe כבר מיושם (useSwipe hook) - יישאר כמו שהוא
- הוספת אינדיקטור נקודות (dots) בתחתית המסך שמראה את המיקום הנוכחי
- הנקודות יהיו עדינות (6px, אפור בהיר, הנוכחית סגולה) עם מעבר חלק

**קבצים:** `src/pages/StoryViewer.tsx`

---

## 3. חוויית טעינה משופרת (Shimmer)

**מצב נוכחי:** כשאין איור, מוצג רכיב MissingIllustrationPrompt עם אייקון פלטה.

**שינוי:**
- כשהאיור עדיין נטען (illustration_url קיים אבל התמונה לא הגיעה), הצגת shimmer effect על רקע פסטלי
- יצירת אנימציית shimmer ב-CSS (gradient נע משמאל לימין)
- ה-preloading כבר קיים במערכת (שורות 147-156) ויישאר כמו שהוא
- הוספת state לזיהוי מתי תמונה סיימה להיטען (onLoad callback)

**קבצים:** `src/pages/StoryViewer.tsx`, `src/pages/StoryViewer.css`

---

## 4. טיפוגרפיה לילדים

**מצב נוכחי:** שלוש רמות גודל - קטן (text-lg), בינוני (text-xl), גדול (text-2xl).

**שינוי:**
- הגדלת כל הרמות: קטן -> `text-xl md:text-2xl`, בינוני -> `text-2xl md:text-3xl`, גדול -> `text-3xl md:text-4xl`
- ברירת מחדל תהיה הגודל הגדול (index 2 במקום 1)
- הגדלת line-height ל-2.0 (כפול) לנוחות קריאה מרבית
- שמירה על גופן Heebo הקיים

**קבצים:** `src/pages/StoryViewer.tsx`

---

## פרטים טכניים

### StoryViewer.tsx - שינויים עיקריים

**FONT_SIZES (שורות 64-68):**
```text
קטן: 'text-xl md:text-2xl'
בינוני: 'text-2xl md:text-3xl'  
גדול: 'text-3xl md:text-4xl'
```
ברירת מחדל: `fontSizeIndex = 2` (גדול)

**הסרת NavigationArrows (שורות 867-874):**
הסרת הרכיב `<NavigationArrows />` מה-render.

**הסרת BookFrame (שורה 876, 1146):**
החלפת `<BookFrame>` בקונטיינר פשוט עם transition opacity.

**שינוי ה-Spread Layout (שורות 1047-1144):**
במקום `flex-row-reverse` (דסקטופ) או `flex-col` (מובייל), תמיד `flex-col`:

```text
- איור: w-full, min-h-[55vh], object-cover, edge-to-edge (ללא border/rounded)
- Gradient overlay: absolute bottom של האיור, h-24, from-transparent to-[#FFFBF5]
- טקסט: padding נדיב, רקע קרם, line-height: 2.0
```

**הוספת Dot Indicator:**
אחרי ה-main, שורה של נקודות:
```text
<div className="flex justify-center gap-2 py-4">
  {spreads.map((_, i) => (
    <div className={cn("w-2 h-2 rounded-full transition-all",
      i === currentPage ? "bg-purple-500 w-3" : "bg-gray-300"
    )} />
  ))}
  // + נקודה ל-cover (-1) ו-end page
</div>
```

**Shimmer Effect (כשאין איור עדיין):**
רקע פסטלי עם אנימציית shimmer במקום MissingIllustrationPrompt (כשה-status הוא generating_illustrations). כשהסטטוס ready ואין איור - עדיין להציג את MissingIllustrationPrompt.

### StoryViewer.css - הוספת shimmer

```text
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-loading {
  background: linear-gradient(90deg, #F3E8FF 25%, #FCE7F3 50%, #F3E8FF 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite ease-in-out;
}
```

### קבצים שישתנו
- `src/pages/StoryViewer.tsx` - שינוי עיקרי: layout, ניווט, טיפוגרפיה
- `src/pages/StoryViewer.css` - הוספת shimmer animation

### קבצים שלא ישתנו
- `src/components/story/book-frame/BookHeader.tsx` - נשאר כמו שהוא
- `src/components/story/book-frame/NavigationArrows.tsx` - לא נמחק, רק לא בשימוש
- `src/hooks/use-swipe.ts` - נשאר כמו שהוא
- `src/components/story/book-frame/BookFrame.tsx` - לא נמחק, רק לא בשימוש
- FlipbookViewer, PublicStoryViewer - לא משתנים

### הערות
- ה-Cover page ודף הסיום (End page) יעוצבו בהתאמה לשפה העיצובית החדשה (ללא מסגרת, רקע קרם)
- כל הפונקציונליות הקיימת (edit, nikud, share, PDF, feedback, TTS) נשמרת ללא שינוי
- ה-swipe כבר מחובר ל-handlePageChange שמנווט בין spreads

