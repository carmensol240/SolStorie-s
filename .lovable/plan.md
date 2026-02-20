
# ניווט עמודים קטן וברור ב-RTL לנגן הסיפורים

## מצב נוכחי
ה-`StoryViewer.tsx` כרגע מאפשר ניווט רק דרך:
- **החלקת אצבע (Swipe)** — עובד רק במובייל
- **לחיצה על 30% מקצוות המסך** — אין אינדיקציה ויזואלית, המשתמש לא יודע שאפשר ללחוץ
- **מקשי חיצים** — רק בדסקטופ

אין כפתורי ניווט גלויים בזמן קריאה (רק נקודות בתחתית). המשתמש מבקש כפתורים **קטנים אך גלויים** שלא יחסמו את הטקסט.

## הפתרון: כפתורי חיצים RTL קטנים ומעוצבים

### מיקום הכפתורים
הכפתורים ימוקמו בשני צדי אזור **הטקסט** (רקע קרם `#FFFBF5`), באמצע הגובה — **לא** על גבי האיור ולא על גבי הטקסט עצמו:

```text
┌─────────────────────────────┐
│                             │
│    [איור - כל הרוחב]        │
│                             │
├────────────────────────────┤
│                             │
│ [◀]  הטקסט של הסיפור  [▶] │  ← כפתורים בצדדים
│      שורה שנייה             │
│                             │
│       • • ● • •             │  ← נקודות התקדמות
└─────────────────────────────┘
```

**RTL נכון:**
- כפתור `▶` (ChevronRight) = **עמוד קודם** — בצד **ימין**
- כפתור `◀` (ChevronLeft) = **עמוד הבא** — בצד **שמאל**

### עיצוב הכפתורים
- גודל: `w-9 h-9` (36px) — קטן אך לחיץ בקלות
- מעוגל לחלוטין (`rounded-full`)
- רקע: `bg-purple-100/80 hover:bg-purple-200` — עדין, לא דומיננטי
- גבול: `border border-purple-200`
- מיקום: `absolute` על הצדדים של אזור הטקסט, מרכז אנכי
- שקיפות כשמנוטרלים: `opacity-30 cursor-not-allowed`
- אנימציה: `transition-all duration-200`

### כללי RTL
מכיוון שהאפליקציה היא `dir="rtl"`:
- **ימין (right)** = עמוד קודם (`handleSpreadChange('prev')`)
- **שמאל (left)** = עמוד הבא (`handleSpreadChange('next')`)

## קובץ לעריכה

### `src/pages/StoryViewer.tsx`

**שינוי יחיד:** בתוך `currentSpread` layout (שורות 1094–1173), בתוך `div` של אזור הטקסט (שורה 1140), הופך ה-`div` ל-`relative` ומוסיפים שני כפתורי ניווט `absolute`:

```tsx
{/* Text area on cream background - relative for nav buttons */}
<div className="relative flex-1 flex flex-col justify-center px-10 py-8 md:px-16 md:py-10 bg-[#FFFBF5]">

  {/* RTL Prev button — right side */}
  <button
    onClick={() => handleSpreadChange('prev')}
    disabled={currentPage <= 0 || isFlipping}
    aria-label="עמוד קודם"
    className={cn(
      "absolute right-1.5 top-1/2 -translate-y-1/2 z-10",
      "w-9 h-9 rounded-full flex items-center justify-center",
      "bg-purple-100/80 hover:bg-purple-200 border border-purple-200",
      "text-purple-600 transition-all duration-200",
      "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-100/80"
    )}
  >
    <ChevronRight className="w-5 h-5" />
  </button>

  {/* Text content */}
  ...

  {/* RTL Next button — left side */}
  <button
    onClick={() => handleSpreadChange('next')}
    disabled={currentPage >= spreads.length || isFlipping}
    aria-label="עמוד הבא"
    className={cn(
      "absolute left-1.5 top-1/2 -translate-y-1/2 z-10",
      "w-9 h-9 rounded-full flex items-center justify-center",
      "bg-purple-100/80 hover:bg-purple-200 border border-purple-200",
      "text-purple-600 transition-all duration-200",
      "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-100/80"
    )}
  >
    <ChevronLeft className="w-5 h-5" />
  </button>

</div>
```

**שינוי padding:** כדי שהטקסט לא יחפוף לכפתורים, ה-padding האופקי עולה מ-`px-6` ל-`px-10` (מ-`px-12` ל-`px-16` בדסקטופ).

## מה לא משתנה
- ניווט Swipe למובייל — נשאר
- ניווט מקשי חיצים לדסקטופ — נשאר
- לחיצה על קצוות המסך — נשאר
- נקודות ההתקדמות בתחתית — נשאר
- כל שאר העמודים (Cover, End) — ללא שינוי

## קובץ בלבד
רק `src/pages/StoryViewer.tsx` — שינוי אחד בתוך ה-spread layout.
