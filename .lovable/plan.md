
# תוכנית לתיקון מצב ההתחברות - יציאה מ-Dev Mode

## הבעיה שזוהתה

אתה תקוע במצב "dev mode" כי:

1. **Dev mode נשמר ב-sessionStorage**: כשמוסיפים `?dev=true` ל-URL, הערך נשמר ב-sessionStorage ונשאר שם לצמיתות
2. **פונקציית signOut לא מנקה את dev mode**: הפונקציה `signOut` ב-`use-auth.ts` לא קוראת ל-`clearDevMode()`
3. **אין דרך לצאת מ-dev mode**: הפונקציה `clearDevMode` קיימת אבל לא משמשת בשום מקום בקוד

### הזרימה הנוכחית (שבורה):
```text
┌─────────────────────────┐
│ URL עם ?dev=true        │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ sessionStorage.devMode  │
│ = 'true'                │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ isDevModeEnabled()      │
│ מחזיר true              │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ useAuth מחזיר           │
│ MOCK_DEV_USER           │
│ (devmode-local)         │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ לחיצה על התנתקות       │
│ = שום דבר לא קורה      │  ← הבעיה!
└─────────────────────────┘
```

---

## שלבי התיקון

### שלב 1: עדכון signOut ב-use-auth.ts
**קובץ:** `src/hooks/use-auth.ts`

הוספת קריאה ל-`clearDevMode()` בפונקציית signOut:

**לפני:**
```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
```

**אחרי:**
```typescript
import { isDevModeEnabled, MOCK_DEV_USER, MOCK_DEV_SESSION, clearDevMode } from './use-dev-mode';

const signOut = async () => {
  // Clear dev mode if active
  clearDevMode();
  
  const { error } = await supabase.auth.signOut();
  return { error };
};
```

### שלב 2: עדכון handleSignOut ב-Settings.tsx
**קובץ:** `src/pages/Settings.tsx`

הוספת ניקוי sessionStorage נוסף לביטחון:

**לפני:**
```typescript
const handleSignOut = async () => {
  await signOut();
  localStorage.removeItem('returnTo');
  window.location.replace("/");
};
```

**אחרי:**
```typescript
const handleSignOut = async () => {
  await signOut();
  localStorage.removeItem('returnTo');
  // Clear dev mode from sessionStorage
  sessionStorage.removeItem('devMode');
  window.location.replace("/");
};
```

### שלב 3: הוספת כפתור "יציאה מ-Dev Mode" ב-DebugMenu
**קובץ:** `src/components/DebugMenu.tsx`

הוספת כפתור ייעודי לניקוי dev mode בתפריט הדיבאג:

```typescript
import { clearDevMode, isDevModeEnabled } from "@/hooks/use-dev-mode";

// בתוך הקומפוננט, לפני רשימת הניווט:
{isDevModeEnabled() && (
  <button
    onClick={() => {
      clearDevMode();
      window.location.replace("/");
    }}
    className="w-full text-center px-4 py-3 rounded-xl bg-red-100 hover:bg-red-200 transition-colors text-red-700 font-medium mb-4"
  >
    🚪 יציאה מ-Dev Mode
  </button>
)}
```

---

## סיכום הקבצים שישתנו

| קובץ | שינוי |
|------|-------|
| `src/hooks/use-auth.ts` | הוספת `clearDevMode()` לפונקציית `signOut` |
| `src/pages/Settings.tsx` | הוספת `sessionStorage.removeItem('devMode')` ל-`handleSignOut` |
| `src/components/DebugMenu.tsx` | הוספת כפתור "יציאה מ-Dev Mode" שמופיע רק במצב dev |

---

## הזרימה לאחר התיקון:
```text
┌─────────────────────────┐
│ לחיצה על התנתקות       │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ clearDevMode()          │
│ sessionStorage.devMode  │
│ = נמחק                  │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ supabase.auth.signOut() │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ window.location.replace │
│ ("/")                   │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ isDevModeEnabled()      │
│ מחזיר false             │
│ = משתמש אמיתי או אורח  │
└─────────────────────────┘
```

---

## הערות חשובות

### לגבי Preview:
ה-Preview של Lovable משתמש ב-Supabase אמיתי - הבעיה היא רק ב-dev mode שנשאר פעיל ב-sessionStorage. אחרי התיקון והתנתקות, תוכל להתחבר עם משתמש אמיתי.

### לניקוי מיידי (עד שהתיקון נכנס):
אפשר לפתוח את Developer Tools בדפדפן (F12), ללכת ל-Application > Session Storage, ולמחוק את `devMode` ידנית.
