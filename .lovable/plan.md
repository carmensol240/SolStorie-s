
# תוכנית: תיקון שגיאת 401 בפונקציית יצירת דמות

## הבעיה שזוהתה

הלוגים מראים שפונקציית `preview-child-avatar` מחזירה **שגיאת 401 (Unauthorized)**:
```
POST | 401 | https://qvdwmkxviaqcgmjotsxe.supabase.co/functions/v1/preview-child-avatar
```

הודעת השגיאה: `"נדרשת התחברות"`

## ניתוח הבעיה

הפונקציה דורשת טוקן אימות (Authorization header) ובודקת אותו בשורות 17-38:
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({ error: "נדרשת התחברות" }),
    { status: 401, ... }
  );
}
```

**הסיבה הסבירה**: הקריאה ל-edge function מתבצעת לפני שה-session מסונכרנת במלואה, או שיש בעיה בהעברת הטוקן.

---

## פתרון

### שלב 1: שיפור בקרת שגיאות ב-AvatarPreviewDialog

**קובץ:** `src/components/story/AvatarPreviewDialog.tsx`

נוסיף בדיקת session לפני קריאה לפונקציה:

```typescript
const generatePreview = useCallback(async () => {
  if (!originalPhoto || isGenerating) return;
  
  // === הוספה חדשה: בדיקת session ===
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setErrorMessage("יש להתחבר מחדש כדי ליצור דמות");
    toast({
      title: 'נדרשת התחברות',
      description: 'אנא התחברו מחדש וננסה שוב',
      variant: 'destructive',
    });
    return;
  }
  // === סוף הוספה ===
  
  // ... המשך הקוד הקיים
```

### שלב 2: עדכון edge function לתמיכה ב-fallback

**קובץ:** `supabase/functions/preview-child-avatar/index.ts`

נוסיף logging משופר לזיהוי הבעיה:

```typescript
const authHeader = req.headers.get("Authorization");
console.log("Auth header present:", !!authHeader);

if (!authHeader?.startsWith("Bearer ")) {
  console.error("Missing or invalid auth header:", authHeader?.substring(0, 20));
  return new Response(
    JSON.stringify({ error: "נדרשת התחברות" }),
    { status: 401, ... }
  );
}
```

### שלב 3: הוספת retry mechanism

נוסיף מנגנון retry אוטומטי אם יש בעיית auth זמנית:

```typescript
// ב-AvatarPreviewDialog - הוספת retry
const [retryCount, setRetryCount] = useState(0);

// בתוך generatePreview:
if (error?.message?.includes('401') && retryCount < 1) {
  // רענון session וניסיון נוסף
  await supabase.auth.refreshSession();
  setRetryCount(prev => prev + 1);
  setTimeout(() => generatePreview(), 500);
  return;
}
```

---

## פרטים טכניים

### Environment Variables (מאומתים תקינים):
- `LOVABLE_API_KEY`: ✅ מוגדר
- `SUPABASE_URL`: ✅ מוגדר אוטומטית
- `SUPABASE_SERVICE_ROLE_KEY`: ✅ מוגדר אוטומטית
- `SUPABASE_ANON_KEY`: ✅ מוגדר אוטומטית

### Storage Bucket:
- `story-illustrations`: ✅ קיים (פרטי)
- `child-photos`: ✅ קיים (פרטי)

### Auth Flow:
- Auth logs מראים התחברות מוצלחת
- הבעיה היא timing בין login לקריאה לפונקציה

---

## סיכום הקבצים לשינוי

| קובץ | פעולה |
|------|--------|
| `src/components/story/AvatarPreviewDialog.tsx` | הוספת בדיקת session וretry |
| `supabase/functions/preview-child-avatar/index.ts` | שיפור logging |

---

## אימות הפתרון

לאחר השינויים, נוכל לבדוק שוב בלוגים:
1. האם יש בקשות עם status 200?
2. האם ה-logging המשופר מראה את הטוקן?
3. האם ה-retry עובד במקרה של כשל ראשוני?
