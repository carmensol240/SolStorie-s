

# תוכנית: תיקון שגיאת "Auth session missing" בפונקציית יצירת דמות

## הבעיה שזוהתה מהלוגים

```
Auth header present: true starts with Bearer: true
getUser result - user exists: false error: Auth session missing!
Auth validation failed: Auth session missing! status: 400
```

הטוקן **מגיע** לפונקציה, אבל `supabase.auth.getUser()` לא מצליחה לאמת אותו כי הפונקציה משתמשת ב-`SUPABASE_ANON_KEY` במקום `SUPABASE_SERVICE_ROLE_KEY`.

## הסיבה הטכנית

| פונקציה | Key בשימוש | סטטוס |
|---------|-----------|--------|
| `generate-illustrations` | `SUPABASE_SERVICE_ROLE_KEY` | ✅ עובדת |
| `preview-child-avatar` | `SUPABASE_ANON_KEY` | ❌ נכשלת |

כאשר Edge Function רוצה לאמת טוקן של משתמש שהגיע מהלקוח, היא חייבת להשתמש ב-`SERVICE_ROLE_KEY` כדי שתהיה לה הרשאה לבצע `getUser()`.

---

## פתרון

### שינוי בקובץ `supabase/functions/preview-child-avatar/index.ts`

החלפת השימוש ב-ANON_KEY ל-SERVICE_ROLE_KEY:

**לפני:**
```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } }
});
```

**אחרי:**
```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: { headers: { Authorization: authHeader } }
});
```

---

## פעולות נוספות

### מניעת שגיאות עתידיות

אם ה-AI provider נכשל (429/500), נוסיף fallback לתמונת ברירת מחדל איכותית כדי שהמשתמש לא יראה הודעת שגיאה אדומה:

```typescript
// אם יצירת התמונה נכשלת, החזר תמונת ברירת מחדל
if (!previewUrl) {
  console.log("AI generation failed, returning default avatar");
  // החזר URL של תמונת ברירת מחדל מ-storage
  return new Response(
    JSON.stringify({ 
      previewUrl: "/placeholder-avatar.png",
      isDefault: true 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## סיכום השינויים

| קובץ | פעולה |
|------|--------|
| `supabase/functions/preview-child-avatar/index.ts` | החלפת `SUPABASE_ANON_KEY` ב-`SUPABASE_SERVICE_ROLE_KEY` |
| פריסה מחדש | נפרוס את הפונקציה המעודכנת |

## תוצאה צפויה

לאחר השינוי:
1. `getUser()` יצליח לאמת את הטוקן
2. הפונקציה תמשיך ליצירת התמונה
3. המשתמש יראה את הדמות המונפשת

---

## בדיקת תקינות

לאחר הפריסה, נבדוק בלוגים שנראה:
```
Auth header present: true starts with Bearer: true
getUser result - user exists: true error: undefined
User authenticated successfully, user id: abc12345...
Generating 3D preview for child photo...
```

