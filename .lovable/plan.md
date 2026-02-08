
# תוכנית לתיקון בעיות קריטיות באתר החי

## הבעיות שזוהו

### בעיה 1: שגיאת 404 בריענון
**סיבה:** האתר מתארח כ-Single Page Application (SPA), אבל אין קובץ `_redirects` שמפנה את כל הנתיבים ל-`index.html`.

**מה קורה:** כשמרעננים דף כמו `/library` או `/settings`, השרת מחפש קובץ פיזי בנתיב הזה ולא מוצא, אז מחזיר 404.

**פתרון:** יצירת קובץ `public/_redirects` עם הכלל:
```
/* /index.html 200
```

---

### בעיה 2: קובץ client.ts מנוהל אוטומטית
**מצב נוכחי:** הקובץ `src/integrations/supabase/client.ts` מכיל:
```typescript
const SUPABASE_URL = "https://xqoxoxxyfimlbekfjxo.supabase.co";
```

**הבהרה חשובה:** הקובץ הזה מסומן כ-"auto-generated" ומנוהל על ידי Lovable Cloud. הוא משתמש ב-Supabase של Lovable Cloud (לא הפרויקט שב-.env). 

**לא נדרש תיקון:** הקובץ הזה לא צריך עריכה ידנית - Lovable Cloud מנהל אותו.

---

### בעיה 3: Dev Mode נתקע
**מה קרה בעבר:** נוסף תיקון שמנקה את `devMode` מ-sessionStorage בעת Logout.

**אימות:** הקוד כבר מעודכן עם:
- `clearDevMode()` ב-`signOut()` של `use-auth.ts`
- `sessionStorage.removeItem('devMode')` ב-`handleSignOut()` של `Settings.tsx`
- כפתור "יציאה מ-Dev Mode" ב-`DebugMenu.tsx`

**חשוב:** Dev Mode עובד רק בסביבת פיתוח (`import.meta.env.DEV`). בייצור, הקוד הזה לא פעיל בכלל.

---

### בעיה 4: שגיאות Edge Function
**מה כבר תוקן:** כל ה-Edge Functions עודכנו עם CORS headers מורחבים.

**פעולה נוספת:** יש לוודא שכל הפונקציות נפרסות מחדש.

---

## שלבי התיקון

### שלב 1: יצירת קובץ _redirects
יצירת קובץ חדש: `public/_redirects`

תוכן הקובץ:
```
/* /index.html 200
```

זה פותר את בעיית ה-404 בריענון ב-Netlify.

---

### שלב 2: הסרת clearDevMode מהתנאי
הבעיה הנוכחית בקובץ `use-dev-mode.ts` היא שהפונקציה `clearDevMode()` עטופה בתנאי:
```typescript
export const clearDevMode = () => {
  if (import.meta.env.DEV) {
    sessionStorage.removeItem('devMode');
  }
};
```

**הבעיה:** בייצור, הפונקציה לא מנקה כלום כי `import.meta.env.DEV` הוא `false`.

**התיקון:** הסרת התנאי מ-`clearDevMode`:
```typescript
export const clearDevMode = () => {
  // Always clear - safe to call in production even though devMode shouldn't be set there
  sessionStorage.removeItem('devMode');
};
```

---

## סיכום הקבצים שישתנו

| קובץ | פעולה |
|------|-------|
| `public/_redirects` | יצירת קובץ חדש עם `/* /index.html 200` |
| `src/hooks/use-dev-mode.ts` | הסרת התנאי מ-`clearDevMode()` לניקוי בטוח גם בייצור |

---

## הערות חשובות

### לגבי ההרשמה וההתחברות
- **הקוד תקין:** כל פונקציות ההתחברות משתמשות ב-`window.location.origin` שמחזיר את הדומיין הנכון בייצור (`https://www.storytime.org.il`).
- **CORS תוקן:** כל ה-Edge Functions כבר עודכנו עם headers מורחבים.
- **Supabase Client:** מנוהל אוטומטית על ידי Lovable Cloud ולא צריך עריכה.

### לגבי devmode-local
אם את רואה `devmode-local` **באתר החי** (לא בעורך), זה מוזר כי Dev Mode לא אמור לעבוד בייצור. התיקון של `clearDevMode` יבטיח שגם אם מישהו הגיע למצב הזה, הוא יוכל לצאת ממנו.
