

# באנר קבוע להתקנת האפליקציה (PWA Install) -- בכל מסכי האפליקציה

## סקירה
יצירת באנר התקנה בולט שמופיע **בכל פתיחה של האפליקציה** עד שהמשתמש מתקין אותה בפועל. הבאנר יוצג בראש המסך בכל הדפים.

## בעיות במצב הנוכחי
- רכיב ה-PWAInstallPrompt קיים רק ב-`Home.tsx` שאינו מחובר לשום Route
- השחרור מבוסס על `sessionStorage` -- נעלם בסגירת הטאב
- לא מופיע במסך הראשי (`Adventure`)

## שינויים

### 1. שכתוב `src/components/pwa/PWAInstallPrompt.tsx`

**שינויים עיקריים:**
- הסרת אפשרות הסגירה (`X`) -- הבאנר לא ניתן לדחייה
- שימוש ב-`localStorage` עם מפתח `pwa-installed` לזכור התקנה מוצלחת בלבד
- שינוי מיקום מ-bottom לבאנר עליון קבוע (top banner)
- טקסט בעברית: "התקינו את האפליקציה לגישה מהירה"
- עבור iOS: פופאפ הנחיות ידניות עם אפשרות סגירה זמנית (חוזר בפתיחה הבאה)
- הבאנר נעלם **רק** כאשר האפליקציה רצה ב-standalone mode (מותקנת)

**לוגיקה:**
```
if (standalone mode) => don't show (app is installed)
if (localStorage has 'pwa-installed') => don't show
if (iOS) => show iOS instructions banner
if (beforeinstallprompt fires) => show install button
else => show generic instructions
```

**עיצוב הבאנר:**
- באנר עליון קבוע (`fixed top-0`) עם גרדיאנט צבעוני
- אייקון הורדה + טקסט "התקינו את האפליקציה לגישה מהירה" + כפתור "התקנה"
- עבור iOS: טקסט הנחיות עם אייקון שיתוף
- iOS בלבד: כפתור X שדוחה עד לפתיחה הבאה (`sessionStorage`)

### 2. הוספה ל-`src/App.tsx`

הוספת `PWAInstallPrompt` ברמת ה-App (מחוץ ל-Routes) כך שיופיע בכל מסך:

```typescript
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
// ...
<BrowserRouter>
  <PWAInstallPrompt />
  <Routes>...</Routes>
</BrowserRouter>
```

### 3. הסרה מ-`src/pages/Home.tsx`

הסרת הייבוא והשימוש ב-`PWAInstallPrompt` מ-Home.tsx כי הרכיב עכשיו ב-App.tsx.

## סיכום קבצים

| קובץ | שינוי |
|-------|-------|
| `src/components/pwa/PWAInstallPrompt.tsx` | שכתוב -- באנר עליון קבוע, ללא אפשרות דחייה (חוץ מ-iOS), טקסט בעברית |
| `src/App.tsx` | הוספת PWAInstallPrompt ברמת האפליקציה |
| `src/pages/Home.tsx` | הסרת PWAInstallPrompt (הועבר ל-App) |

## פרטים טכניים

- **Android/Desktop**: הבאנר נשאר תמיד עד שהמשתמש לוחץ "התקנה" ומאשר. לאחר התקנה מוצלחת, נשמר `localStorage.pwa-installed` והבאנר נעלם.
- **iOS**: מוצגות הנחיות ידניות (שיתוף -> הוסף למסך הבית). כפתור X דוחה לסשן הנוכחי בלבד -- חוזר בפתיחה הבאה.
- **Standalone mode**: הבאנר לא מוצג כלל כשהאפליקציה כבר רצה כ-PWA.
- **מיקום**: `fixed top-0 left-0 right-0 z-[200]` -- מעל כל האלמנטים, כולל header.
- רכיבים שיש להם header עליון (כמו Adventure) יקבלו padding-top מותאם דרך CSS או spacer.
