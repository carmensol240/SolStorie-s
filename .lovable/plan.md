

## שדרוג חוויית הדפדוף ואחידות עיצוב

### מצב נוכחי
- מעבר בין דפים: fade פשוט (opacity 0→1 + scale 0.98→1) באורך 300ms
- יישור טקסט: כבר top-aligned (תוקן בשלב קודם)
- איורים: כבר full-width (תוקן בשלב קודם)
- נושאים בעברית: כבר מתורגמים (תוקן בשלב קודם)
- סדר דפים: כבר נכון (cover → dedication → content → closing → end)
- PWA: ללא שינוי

### שינוי עיקרי: אנימציית דפדוף ספר (Book Page Flip)

**קובץ: `src/pages/StoryViewer.css`**
- הוספת CSS keyframes לאנימציית flip תלת-ממדית:
  - `page-flip-out-next`: סיבוב על ציר Y מ-0° ל--90° (דף הנוכחי "מתקפל" שמאלה)
  - `page-flip-in-next`: סיבוב על ציר Y מ-90° ל-0° (דף הבא "נפתח" מימין)
  - `page-flip-out-prev` / `page-flip-in-prev`: כיוון הפוך לחזרה
- הוספת `transform-origin: right center` (RTL) כדי שהדף "מסתובב" מהצד הימני כמו ספר עברי
- הוספת `backface-visibility: hidden` למניעת תצוגת צד אחורי
- שימוש ב-`perspective: 1200px` שכבר קיים ב-`.book-container`

**קובץ: `src/pages/StoryViewer.tsx`**
- עדכון ה-`handlePageNav` לשימוש ב-4 phases: `idle` → `flip-out` → (change page) → `flip-in` → `idle`
- עדכון ה-`className` של ה-page container להחלת ה-CSS animation classes במקום opacity/scale
- זמני האנימציה: 350ms flip-out + 350ms flip-in = 700ms סה"כ (חוויה חלקה ומוחשית)

### פירוט טכני

```text
  ┌────────────┐    350ms    ┌────────────┐    350ms    ┌────────────┐
  │  Page A    │ ──flip-out──▸│  (switch)  │ ──flip-in──▸│  Page B    │
  │  idle      │             │  page data │             │  idle      │
  └────────────┘             └────────────┘             └────────────┘
```

CSS animation classes:
- `flip-out === 'out'` + `flipDirection === 'next'` → `page-flip-out-next`
- `flip-in === 'in'` + `flipDirection === 'next'` → `page-flip-in-next`
- Same for `prev` direction (opposite rotation)

### קבצים שישתנו
| קובץ | שינוי |
|-------|-------|
| `src/pages/StoryViewer.css` | הוספת keyframes ו-classes לאנימציית flip |
| `src/pages/StoryViewer.tsx` | עדכון flipPhase classes ותזמונים |

### מה לא משתנה
- יישור טקסט (כבר top-aligned)
- איורים full-width (כבר תוקן)
- נושאים בעברית (כבר תוקן)
- סדר דפים (כבר נכון)
- הגדרות PWA (ללא שינוי)

