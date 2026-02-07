

# החזרת כפתורי התנתקות ומחיקת חשבון + הוספת תיבת "אודות"

## סיכום

הכפתורים קיימים בקוד אך ייתכן שנדחפים מחוץ לאזור הנראה. נשפר את הנראות שלהם ונוסיף תיבת "אודות" עם הטקסט המלא.

---

## שינויים נדרשים

### 1. שיפור נראות כפתורי התנתקות ומחיקת חשבון
- הכפתורים קיימים (שורות 125-143) אך עשויים להידחף למטה
- נוודא שהם בולטים יותר עם רקע וגבולות ברורים

### 2. הוספת תיבת "אודות" עם דיאלוג
מכיוון שהטקסט ארוך מאוד, נוסיף:
- **כפתור "אודות"** ברשימת התפריט עם אייקון `Info`
- **דיאלוג (Dialog)** שייפתח בלחיצה ויכיל את כל הטקסט עם גלילה

---

## פרטים טכניים

### קובץ: `src/pages/Settings.tsx`

#### שינוי 1: ייבוא רכיבים נוספים
```tsx
import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
```

#### שינוי 2: הוספת state לדיאלוג
```tsx
const [aboutOpen, setAboutOpen] = useState(false);
```

#### שינוי 3: הוספת כפתור "אודות" לתפריט
יתווסף מיד אחרי כפתור "הגדרות נגישות":
```tsx
{/* About Button */}
<button
  onClick={() => setAboutOpen(true)}
  className="w-full flex items-center justify-between bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-right shadow-sm"
  aria-label="אודות StoryTime"
>
  <ArrowRight className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
  <div className="flex items-center gap-2">
    <span className="font-medium text-sm text-foreground">אודות</span>
    <div className="w-7 h-7 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
      <Info className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
    </div>
  </div>
</button>
```

#### שינוי 4: הוספת דיאלוג "אודות" עם כל הטקסט
הדיאלוג יכיל את הטקסט המלא שסופק עם:
- כותרת "📖 אודות StoryTime ✨"
- אזור גלילה (ScrollArea) לתוכן הארוך
- עיצוב RTL מותאם

```tsx
<Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
  <DialogContent className="max-w-lg max-h-[80vh]" dir="rtl">
    <DialogHeader>
      <DialogTitle className="text-center text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
        📖 להפוך את הקושי לסיפור קסום – StoryTime ✨
      </DialogTitle>
    </DialogHeader>
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
        {/* כל הטקסט המלא */}
      </div>
    </ScrollArea>
  </DialogContent>
</Dialog>
```

#### שינוי 5: שיפור נראות כפתורי התנתקות ומחיקה
שינוי מ-`bg-white/40` ל-`bg-white/70` ושינוי ה-height ל-`h-9`:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleSignOut}
  className="w-full justify-between text-muted-foreground hover:text-foreground bg-white/70 dark:bg-white/10 backdrop-blur-sm text-sm h-9 border border-purple-100"
>
  <LogOut className="w-4 h-4" />
  <span>התנתקות</span>
</Button>

<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate("/account-exit")}
  className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10 bg-white/70 dark:bg-white/10 backdrop-blur-sm text-sm h-9 border border-red-100"
>
  <Trash2 className="w-4 h-4" />
  <span>מחיקת חשבון</span>
</Button>
```

---

## מבנה המסך המעודכן

```text
┌──────────────────────────────┐
│  Hero (תמונת רקע + פרטי משתמש)  │
├──────────────────────────────┤
│  ניהול ילדים                   │
│  יצירת קשר                     │
│  תנאי שימוש                    │
│  מדיניות פרטיות                │
│  הגדרות נגישות                 │
│  אודות  ← חדש!                 │
├──────────────────────────────┤
│  [התנתקות]                     │
│  [מחיקת חשבון]                 │
└──────────────────────────────┘
│  MobileNavigation              │
└──────────────────────────────┘
```

---

## קבצים שישתנו

| קובץ | סוג שינוי |
|------|-----------|
| `src/pages/Settings.tsx` | הוספת כפתור "אודות", דיאלוג עם טקסט מלא, שיפור נראות כפתורי התנתקות/מחיקה |

