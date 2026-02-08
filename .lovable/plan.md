

# תוכנית לתיקון שגיאות Edge Functions - סנכרון מפתחות וכתובות

## זיהוי הבעיות

### בעיה 1: קובץ client.ts מכיל URL שגוי
הקובץ `src/integrations/supabase/client.ts` מכיל:
```typescript
const SUPABASE_URL = "https://xqoxoxxyfimlbekfjxo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_S0gSqpCtgvwtUSAT_25PQ_092wz...";
```

**הבעיה:** הקובץ הזה נוצר אוטומטית על ידי Lovable Cloud ומצביע על פרויקט `qvdwmkxviaqcgmjotsxe`, אבל מכיל URL שונה (`xqoxoxxyfimlbekfjxo`).

⚠️ **חשוב:** הקובץ הזה מסומן כ-auto-generated ואסור לערוך אותו ידנית. Lovable Cloud מנהל אותו אוטומטית.

### בעיה 2: קריאה ידנית ל-Edge Function בשימוש ב-fetch
בקובץ `src/hooks/use-auth.ts` (שורות 83-96) יש קריאה ידנית:
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ email, redirectUrl }),
  }
);
```

**הבעיה:** הקריאה משתמשת רק ב-`apikey` header ולא ב-`Authorization` header כמו שאר הקריאות.

### בעיה 3: כתובת Lovable זמנית באימייל רכישה
בקובץ `supabase/functions/send-purchase-confirmation/index.ts` (שורות 96-99):
```html
<a href="https://id-preview--cc8c1180-5dc9-4849-9798-d96e4a36e7af.lovable.app/create" ...>
```

**הבעיה:** כתובת URL זמנית של Lovable במקום `https://www.storytime.org.il`.

---

## שלבי התיקון

### שלב 1: תיקון קריאת Edge Function ב-use-auth.ts
**קובץ:** `src/hooks/use-auth.ts`

שינוי הקריאה ל-`send-password-reset` להשתמש ב-`supabase.functions.invoke` במקום `fetch` ידני:

**לפני:**
```typescript
const resetPasswordForEmail = async (email: string) => {
  const redirectUrl = `${window.location.origin}/reset-password`;
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email, redirectUrl }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: new Error(data.error || 'Failed to send reset email') };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: error as Error };
  }
};
```

**אחרי:**
```typescript
const resetPasswordForEmail = async (email: string) => {
  const redirectUrl = `${window.location.origin}/reset-password`;
  
  try {
    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email, redirectUrl },
    });
    
    if (error) {
      console.error('Password reset error:', error);
      return { error: new Error(error.message || 'Failed to send reset email') };
    }
    
    if (data?.error) {
      return { error: new Error(data.error) };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: error as Error };
  }
};
```

**יתרון:** `supabase.functions.invoke` מוסיף אוטומטית את כל ה-headers הנדרשים כולל Authorization.

---

### שלב 2: עדכון כתובת האתר באימייל רכישה
**קובץ:** `supabase/functions/send-purchase-confirmation/index.ts`

**לפני (שורה 96):**
```html
<a href="https://id-preview--cc8c1180-5dc9-4849-9798-d96e4a36e7af.lovable.app/create" ...>
```

**אחרי:**
```html
<a href="https://www.storytime.org.il/create" ...>
```

---

### שלב 3: עדכון כתובת האתר באימייל איפוס סיסמה (אם יש)
**קובץ:** `supabase/functions/send-password-reset/index.ts`

הקובץ הזה כבר תקין - הוא משתמש ב-`redirectUrl` שמגיע מהקליינט, כך שהכתובת תהיה נכונה (`window.location.origin`).

---

## סיכום השינויים

| קובץ | שינוי |
|------|-------|
| `src/hooks/use-auth.ts` | שימוש ב-`supabase.functions.invoke` במקום `fetch` ידני |
| `supabase/functions/send-purchase-confirmation/index.ts` | עדכון URL מ-Lovable preview ל-`https://www.storytime.org.il` |

---

## הערות חשובות

### לגבי קובץ client.ts
הקובץ `src/integrations/supabase/client.ts` מנוהל אוטומטית על ידי Lovable Cloud. אם יש אי-התאמה בין ה-URL בקובץ למה שמוגדר ב-Netlify, הבעיה היא:
- Lovable Cloud משתמש בפרויקט `qvdwmkxviaqcgmjotsxe`
- ה-URL בקובץ הוא `xqoxoxxyfimlbekfjxo` (שגוי)

**הפתרון:** לאחר השינויים, יש לוודא שה-Environment Variables ב-Netlify תואמים את פרויקט Lovable Cloud:
- `VITE_SUPABASE_URL`: `https://qvdwmkxviaqcgmjotsxe.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: המפתח מה-.env

### לגבי Edge Functions
כל ה-Edge Functions כבר משתמשות ב-`Deno.env.get("SUPABASE_URL")` ו-`Deno.env.get("SUPABASE_ANON_KEY")` - זה נכון! הן קוראות מ-secrets שמוגדרים ב-Lovable Cloud.

### לגבי window.location.origin
השימוש ב-`window.location.origin` בצד הקליינט הוא נכון - הוא יחזיר `https://www.storytime.org.il` כשהאתר פועל בייצור.

