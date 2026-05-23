## מטרה

כפתור פשוט שמחליף את `carmit1901+test@gmail.com` בין שני מצבים בלי שינויי DB:

1. **מצב דמו** — `isDemoUser=true` תמיד, פופאפ רכישה אחרי עמוד 3, פיצ'רי משלם חסומים.
2. **מצב אדמין** — גישה מלאה לסיפורים שלמים, ללא paywall.

## מימוש

### 1. `src/pages/StoryViewer.tsx` (שורות 18, 451-458)

החלפת הקבוע הקיים בקריאה ל-localStorage flag:

```ts
const TESTER_EMAIL = 'carmit1901+test@gmail.com';
const ORIGINAL_TESTER = 'carmit1901@gmail.com';

// בתוך הקומפוננטה:
const emailLower = user?.email?.toLowerCase();
const isTesterAccount = emailLower === TESTER_EMAIL;
// קריאה מ-localStorage: ברירת מחדל = 'demo'
const testerMode = isTesterAccount
  ? (localStorage.getItem('tester_mode') ?? 'demo')
  : null;
const isForcedDemo = testerMode === 'demo';
const isTester = emailLower === ORIGINAL_TESTER || testerMode === 'admin';

const isDemoUser = !!user && (
  isForcedDemo ||
  (!hasPurchasedPackage && !isSubscriberUser && !isAdminUser && !isTester)
);
```

### 2. `src/pages/Settings.tsx`

הוספת כרטיס קטן חדש שמוצג **רק** אם `user.email === 'carmit1901+test@gmail.com'`:

- כותרת: "מצב בדיקה (Tester)"
- Toggle/Switch בין שני מצבים: "דמו" / "אדמין"
- בלחיצה: `localStorage.setItem('tester_mode', 'demo'|'admin')` + `window.location.reload()` כדי שכל הקומפוננטות יקבלו את המצב החדש.
- מצב נוכחי נקרא מ-`localStorage.getItem('tester_mode') ?? 'demo'`.

הכרטיס לא תלוי ב-`isAdmin`, רק במייל — כך גם במצב דמו עדיין רואים את הכפתור להחזיר ל-אדמין.

## מה לא נעשה

- אין שינוי DB / RLS / roles.
- אין שינוי לחשבונות אחרים.
- אין שינוי ב-`DemoLockModal`, `Upgrade`, או hooks של credits.
- `carmit1901@gmail.com` נשאר tester משלם כרגיל.
