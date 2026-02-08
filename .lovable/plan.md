

# תיקון קריטי: שגיאת API Key ב-generate-story

## 🔴 שורש הבעיה שזוהתה

מהלוגים של Edge Function:
```
AI Gateway error: 401 {"type":"unauthorized","message":"Invalid API key format. Key must start with 'sk_' prefix.","details":""}
Using API key from server secrets
```

### הבעיה הטכנית

| פונקציה | API Key בשימוש | תוצאה |
|---------|---------------|--------|
| `preview-child-avatar` | `LOVABLE_API_KEY` בלבד | ✅ עובד |
| `generate-story` | `OPENAI_API_KEY` → `AI_API_KEY` → `LOVABLE_API_KEY` | ❌ נכשל |

הפונקציה `generate-story` מנסה להשתמש ב-`OPENAI_API_KEY` **לפני** `LOVABLE_API_KEY`:

```typescript
// ❌ הקוד הנוכחי - בוחר מפתח לא תקין!
const LOVABLE_API_KEY = Deno.env.get("OPENAI_API_KEY") 
  || Deno.env.get("AI_API_KEY") 
  || Deno.env.get("LOVABLE_API_KEY");
```

ה-`OPENAI_API_KEY` מוגדר במערכת אבל **אינו בפורמט הנכון** לשער ה-AI של Lovable (צריך להתחיל ב-`'sk_'`).

---

## פתרון

### שינוי בקובץ `supabase/functions/generate-story/index.ts`

שינוי סדר העדיפויות של מפתחות ה-API - `LOVABLE_API_KEY` ראשון:

**לפני (שורות 553-556):**
```typescript
const LOVABLE_API_KEY = Deno.env.get("OPENAI_API_KEY") 
  || Deno.env.get("AI_API_KEY") 
  || Deno.env.get("LOVABLE_API_KEY");
```

**אחרי:**
```typescript
// Prioritize LOVABLE_API_KEY for ai.gateway.lovable.dev
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
if (!LOVABLE_API_KEY) {
  console.error("LOVABLE_API_KEY is not configured");
  throw new Error("API key not configured");
}
```

**הסבר:** מכיוון שהפונקציה משתמשת ב-`ai.gateway.lovable.dev`, היא חייבת להשתמש ב-`LOVABLE_API_KEY` ולא ב-`OPENAI_API_KEY`.

---

## סיכום הפעולות

| קובץ | פעולה |
|------|--------|
| `supabase/functions/generate-story/index.ts` | החלפת לוגיקת בחירת API Key - שימוש ב-LOVABLE_API_KEY בלבד |
| פריסה מחדש | פריסת הפונקציה המעודכנת |

---

## תוצאה צפויה

לאחר התיקון:
1. הפונקציה תשתמש ב-`LOVABLE_API_KEY` התקין
2. הקריאה ל-AI Gateway תעבוד בהצלחה
3. הסיפורים ייווצרו ללא שגיאות

---

## הערות אבטחה

- ה-`LOVABLE_API_KEY` מוגדר אוטומטית על ידי המערכת ומסומן כ-"cannot be deleted"
- זה המפתח הנכון לשימוש עם `ai.gateway.lovable.dev`
- ה-`OPENAI_API_KEY` עדיין קיים במערכת אך אינו רלוונטי לשער זה

