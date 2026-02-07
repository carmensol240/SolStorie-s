

# התאמת מסך פרופיל - הגדלת תיבת משתמש ושיפור נגישות כפתורים

## סיכום השינויים

1. **הגדלת תיבת שם משתמש וקרדיטים** - טקסט גדול יותר וריווח נוח יותר
2. **הגדלת ה-Hero לכיוון מטה** - מ-`h-24` ל-`h-32` לניצול השטח הריק
3. **וידוא נגישות כפתורי התנתקות ומחיקת חשבון** - העלאתם למעלה על ידי שינוי מבנה ה-layout

---

## פרטים טכניים

### קובץ: `src/pages/Settings.tsx`

#### שינוי 1: הגדלת תיבת שם משתמש וקרדיטים (שורות 77-90)

**לפני:**
```tsx
<div className="absolute top-1.5 right-1.5">
  <div className="bg-white/10 backdrop-blur-md rounded-lg px-1.5 py-0.5 flex items-center gap-1.5 border border-white/10">
    <button className="... px-1 py-0.5 ...">
      <Coins className="w-2.5 h-2.5 ..." />
      <span className="... text-[9px]">{totalCredits}</span>
    </button>
    <p className="... text-[9px] truncate max-w-[80px]">{user.email?.split('@')[0]}</p>
  </div>
</div>
```

**אחרי:**
```tsx
<div className="absolute top-3 right-3">
  <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 border border-white/20 shadow-lg">
    <button className="... px-2 py-1 ...">
      <Coins className="w-4 h-4 ..." />
      <span className="... text-sm font-bold">{totalCredits}</span>
    </button>
    <p className="... text-sm truncate max-w-[120px]">{user.email?.split('@')[0]}</p>
  </div>
</div>
```

**שינויים עיקריים:**
- טקסט מ-`text-[9px]` ל-`text-sm`
- אייקון קרדיטים מ-`w-2.5 h-2.5` ל-`w-4 h-4`
- ריווח פנימי מ-`px-1.5 py-0.5` ל-`px-3 py-2`
- רוחב שם משתמש מ-`max-w-[80px]` ל-`max-w-[120px]`

#### שינוי 2: הגדלת גובה ה-Hero (שורה 70)

**לפני:**
```tsx
className="relative h-24 flex-shrink-0 bg-cover bg-center"
```

**אחרי:**
```tsx
className="relative h-32 flex-shrink-0 bg-cover bg-center"
```

#### שינוי 3: שינוי מבנה האזור הראשי (שורה 94)

הבעיה הנוכחית היא ש-`justify-between` דוחף את כפתורי ההתנתקות למטה מדי. נשנה את המבנה כך שהכפתורים יהיו חלק מהרשימה עצמה.

**לפני:**
```tsx
<div className="flex-1 flex flex-col justify-between px-3 py-2">
  <div className="space-y-1.5">
    {/* Menu items */}
  </div>
  
  {/* Danger Zone - נדחף למטה */}
  <div className="space-y-1 pt-1.5 border-t ...">
```

**אחרי:**
```tsx
<div className="flex-1 flex flex-col px-3 py-2 overflow-y-auto">
  <div className="space-y-1.5">
    {/* Menu items */}
  </div>
  
  {/* Danger Zone - מיד אחרי התפריט */}
  <div className="space-y-1.5 mt-3 pt-2 border-t ...">
```

---

## מבנה המסך המעודכן

```text
┌──────────────────────────────┐
│  Hero (h-32 במקום h-24)       │
│     ┌──────────────────┐     │
│     │ 💰 5 │ username   │     │  ← תיבה מוגדלת
│     └──────────────────┘     │
├──────────────────────────────┤
│  ניהול ילדים                   │
│  יצירת קשר                     │
│  תנאי שימוש                    │
│  מדיניות פרטיות                │
│  הגדרות נגישות                 │
│  אודות                         │
│  ─────────────────────────    │
│  [התנתקות]                     │  ← נגיש יותר
│  [מחיקת חשבון]                 │  ← כבר קיים ומוביל ל-/account-exit
└──────────────────────────────┘
│  MobileNavigation              │
└──────────────────────────────┘
```

---

## קבצים שישתנו

| קובץ | סוג שינוי |
|------|-----------|
| `src/pages/Settings.tsx` | הגדלת תיבת משתמש, הגדלת Hero, שיפור נגישות כפתורים |

