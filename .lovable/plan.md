

# תוכנית לתיקון שגיאות Edge Functions - עדכון CORS Headers

## סיכום הבעיה

מספר Edge Functions חסרים את ה-CORS headers המורחבים שנדרשים עבור Supabase SDK. ה-SDK שולח headers נוספים שאם לא מוגדרים ב-`Access-Control-Allow-Headers`, הבקשות ייכשלו.

---

## הפונקציות שצריכות תיקון

| פונקציה | CORS נוכחי | סטטוס |
|---------|-----------|-------|
| `send-purchase-confirmation` | headers בסיסיים | ❌ צריך עדכון |
| `send-contact-form` | headers בסיסיים | ❌ צריך עדכון |
| `preview-child-avatar` | headers בסיסיים | ❌ צריך עדכון |
| `add-nikud` | headers בסיסיים | ❌ צריך עדכון |
| `track-event` | headers בסיסיים | ❌ צריך עדכון |
| `get-signed-photo-url` | headers בסיסיים | ❌ צריך עדכון |
| `enhance-text` | headers בסיסיים | ❌ צריך עדכון |
| `get-settings` | headers בסיסיים | ❌ צריך עדכון |

---

## השינוי הנדרש

לכל פונקציה, יש לעדכן את ה-CORS headers מ:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

ל:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

## קבצים שישתנו

### 1. `supabase/functions/send-purchase-confirmation/index.ts`
שורות 6-9: עדכון corsHeaders

### 2. `supabase/functions/send-contact-form/index.ts`
שורות 6-10: עדכון corsHeaders

### 3. `supabase/functions/preview-child-avatar/index.ts`
שורות 5-8: עדכון corsHeaders

### 4. `supabase/functions/add-nikud/index.ts`
שורות 5-8: עדכון corsHeaders

### 5. `supabase/functions/track-event/index.ts`
שורות 5-8: עדכון corsHeaders

### 6. `supabase/functions/get-signed-photo-url/index.ts`
שורות 3-6: עדכון corsHeaders

### 7. `supabase/functions/enhance-text/index.ts`
שורות 5-8: עדכון corsHeaders

### 8. `supabase/functions/get-settings/index.ts`
שורות 3-6: עדכון corsHeaders

---

## אימות נוסף שכבר הושלם

- ✅ **קריאות Edge Functions בצד הלקוח:** כל הקריאות משתמשות ב-`supabase.functions.invoke()` (לא `fetch` ידני)
- ✅ **כתובות זמניות:** אין כתובות Lovable/Netlify זמניות בקוד
- ✅ **Site URL:** הכתובת `https://www.storytime.org.il/create` מוגדרת נכון באימייל הרכישה
- ✅ **Environment Variables:** כל ה-Edge Functions משתמשות ב-`Deno.env.get()` לקריאת secrets

---

## פעולות נוספות לאחר התיקון

לאחר עדכון הקבצים, יש לבצע Deploy לכל ה-Edge Functions:
- send-purchase-confirmation
- send-contact-form  
- preview-child-avatar
- add-nikud
- track-event
- get-signed-photo-url
- enhance-text
- get-settings

