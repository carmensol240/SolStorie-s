
# תוכנית: תיקון הצגת איורי הסיפורים ותמונות השער

## סקירת הבעיה

### מה עובד:
- יצירת סיפורים עובדת (תוקן בשלב הקודם)
- יצירת איורים עובדת - כפי שנראה בלוגים:
  ```
  Illustration generated successfully
  Image uploaded successfully, path: ea82cf85-69b6-4f05-a5a4-5309d3faf71c/page-1.png
  Page 1 illustration saved
  Story illustrations completed!
  ```
- האיורים נשמרים בהצלחה בסטוראג' ובמסד הנתונים

### מה לא עובד:
הפונקציה `get-signed-illustration-url` מחזירה שגיאת 401 Unauthorized:
```
{"error":"Unauthorized access to illustrations"}
```

### גורם הבעיה:
הפונקציה משתמשת באותו **דפוס אימות ישן ושבור** שתוקן כבר בפונקציות האחרות:

```typescript
// ❌ הקוד הנוכחי - לא עובד!
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabaseClient.auth.getUser();
```

**זה אותו הבאג בדיוק** שתוקן ב-`generate-story` וב-`preview-child-avatar`.

---

## פתרון

### שינוי בקובץ `supabase/functions/get-signed-illustration-url/index.ts`

החלפת דפוס האימות לשיטה התקינה (שורות 45-52):

**לפני:**
```typescript
if (authHeader?.startsWith("Bearer ")) {
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
```

**אחרי:**
```typescript
if (authHeader?.startsWith("Bearer ")) {
  // Extract token and validate directly using service role client
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
```

**הסבר:**
- במקום ליצור קליינט נפרד עם ANON_KEY והעברת Authorization header
- נשתמש בקליינט ה-Admin שכבר קיים בפונקציה
- נעביר את הטוקן ישירות ל-`getUser(token)`
- זו אותה שיטה שעובדת בשאר הפונקציות

---

## תוכנית הפעולה

| שלב | פעולה |
|-----|--------|
| 1 | עדכון `get-signed-illustration-url/index.ts` - תיקון דפוס האימות |
| 2 | פריסה מחדש של הפונקציה |
| 3 | בדיקה שהאיורים מוצגים |

---

## סיכום הבעיה והפתרון

| רכיב | סטטוס | פעולה |
|------|--------|--------|
| generate-story | עובד | תוקן קודם |
| generate-illustrations | עובד | לא צריך שינוי |
| get-signed-illustration-url | **נכשל** | **תיקון אימות** |
| SignedImage component | עובד | לא צריך שינוי |
| StoryListItem (ספרייה) | עובד | לא צריך שינוי |

---

## תוצאה צפויה

לאחר התיקון:
1. הפונקציה `get-signed-illustration-url` תחזיר URLs חתומים במקום שגיאת 401
2. תמונות השער יופיעו בספרייה
3. האיורים יופיעו בעמודי הסיפור
4. כל סיפור חדש יציג את כל האיורים שלו
