
# תוכנית: תיקון שגיאת אימות בפונקציית יצירת דמות

## הבעיה המזוהה

מהלוגים האחרונים:
```
13:19:44Z INFO Auth header present: true starts with Bearer: true
(אין לוג נוסף - הפונקציה מחזירה 401)
```

הטוקן מגיע לפונקציה, אבל הקריאה ל-`supabase.auth.getUser()` נכשלת **בשקט** - אין לוג שמראה את השגיאה.

## אימותים שבוצעו

| בדיקה | סטטוס | הערות |
|-------|--------|--------|
| Storage Buckets | ✅ תקין | `child-photos` ו-`story-illustrations` קיימים |
| RLS Policies | ✅ תקין | מדיניות מאפשרת upload/view למשתמשים מאומתים |
| LOVABLE_API_KEY | ✅ מוגדר | זמין כ-secret |
| SUPABASE_ANON_KEY | ✅ אוטומטי | מסופק ע"י המערכת |
| Edge Function Deployed | ✅ | נפרס מחדש |

## גורם הבעיה

הקריאה ל-`getUser()` מחזירה שגיאה אבל אין logging לזה. השגיאה הסבירה:
- "Invalid JWT" או "Token expired"

## פתרון

### שלב 1: הוספת logging מפורט לפונקציית Edge

שינוי בקובץ `supabase/functions/preview-child-avatar/index.ts`:

```typescript
// לפני:
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: "טוקן לא תקין או שפג תוקפו" }),
    { status: 401, ... }
  );
}

// אחרי:
const { data: { user }, error: authError } = await supabase.auth.getUser();
console.log("getUser result - user:", !!user, "error:", authError?.message);

if (authError) {
  console.error("Auth validation failed:", authError.message, authError.status);
  return new Response(
    JSON.stringify({ error: "טוקן לא תקין או שפג תוקפו" }),
    { status: 401, ... }
  );
}

if (!user) {
  console.error("No user found in token");
  return new Response(
    JSON.stringify({ error: "לא נמצא משתמש" }),
    { status: 401, ... }
  );
}

console.log("User authenticated:", user.id);
```

### שלב 2: שיפור הטיפול בלקוח (אופציונלי)

אם השגיאה היא "Token expired", נוסיף refresh לפני הקריאה:

```typescript
// ב-AvatarPreviewDialog לפני invoke:
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (!session) {
  // נסה לרענן את ה-session
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    setErrorMessage("יש להתחבר מחדש");
    return;
  }
}
```

הלוגיקה הזו כבר קיימת חלקית, אך נוודא שהיא פועלת נכון.

---

## סיכום השינויים

| קובץ | פעולה |
|------|--------|
| `supabase/functions/preview-child-avatar/index.ts` | הוספת logging מפורט ל-getUser |
| Edge function deployment | פריסה מחדש לאחר השינוי |

## תוצאה צפויה

לאחר השינוי:
1. נראה בלוגים **בדיוק** מה השגיאה ב-getUser
2. נוכל לתת הודעה ברורה למשתמש
3. נזהה אם הבעיה היא token expired / invalid / missing

## הערה

אם הבעיה מתגלה כ-token expired, ייתכן שהמשתמש צריך להתחבר מחדש או שיש בעיית timing בין ההתחברות לפתיחת הדיאלוג.
