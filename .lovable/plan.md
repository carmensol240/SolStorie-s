
# תוכנית לתיקון בעיית יצירת סיפורים ותמונות

## סיכום הבעיות שזוהו

לאחר בדיקה מקיפה של הקוד, הלוגים, ובסיס הנתונים, זוהו מספר בעיות שגורמות לכישלון הטעינה:

### בעיה 1: אי-התאמה בין פורמט ה-URL לבין ה-SignedImage component

**מה קורה:**
- הקוד החדש ב-Edge Functions שומר **נתיבי Storage** (למשל `uuid/page-1.png`)
- אבל סיפורים ישנים שמורים עם **URLs מלאים ציבוריים** (למשל `https://xxx.supabase.co/storage/v1/object/public/...`)
- ה-`extractPathFromUrl` ב-`use-signed-urls.ts` מנסה לחלץ נתיב מ-URLs ציבוריים, אבל המערכת ב-`get-signed-illustration-url` מאמתת רק נתיבים בפורמט `uuid/page-X.png`

**התוצאה:** התמונות לא נטענות כי ה-SignedImage לא מצליח לקבל signed URL עבור URLs ישנים

### בעיה 2: הפונקציה `generate-illustrations` לא רושמת לוגים

**מה קורה:**
- בדיקת הלוגים של `generate-illustrations` מראה "No logs found"
- זה יכול להצביע על כך שהפונקציה לא נקראת כלל או נכשלת לפני שהיא מתחילה

### בעיה 3: ה-`generate-story` דורש authentication

**מה קורה:**
- הפונקציה מחזירה 401 אם אין Authorization header
- זה נכון ומוגדר כמו שצריך, אבל צריך לוודא שה-frontend שולח את ה-token כראוי

---

## שלבי התיקון

### שלב 1: תיקון `use-signed-urls.ts` לתמוך בשני פורמטים

הבעיה העיקרית: ה-Regex ב-`extractPathFromUrl` מחזיר את הנתיב מ-URL ציבורי, אבל ה-Edge Function `get-signed-illustration-url` מסנן נתיבים שלא מתאימים לפורמט `uuid/page-X.png`.

**הפתרון:** לשפר את ה-`extractPathFromUrl` כך שיחזיר נתיב תקין גם עבור URLs ציבוריים:

```text
┌─────────────────────────────────────────────────────────────┐
│  extractPathFromUrl - לפני התיקון                            │
├─────────────────────────────────────────────────────────────┤
│  קלט: "https://xxx/storage/.../story-illustrations/abc/p.png"│
│  פלט: "abc/p.png" ← לא עובר validation (צריך "page-X.png")    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  extractPathFromUrl - אחרי התיקון                            │
├─────────────────────────────────────────────────────────────┤
│  קלט: "https://xxx/storage/.../story-illustrations/abc/p.png"│
│  פלט: "abc/page-1.png" ← תיקון הפורמט                         │
└─────────────────────────────────────────────────────────────┘
```

### שלב 2: תיקון ה-Edge Function `get-signed-illustration-url`

הבעיה: ה-Regex validation קשוח מדי:
```typescript
path.match(/^[a-f0-9-]+\/page-\d+\.png$/)
```

**הפתרון:** להרחיב את ה-validation לתמוך גם בפורמטים אחרים או להמיר URLs לנתיבים בצד השרת

### שלב 3: ווידוא שה-`generate-illustrations` נקרא נכון

הבעיה האפשרית: ב-`generate-story` יש קריאה ל-`generate-illustrations` עם Service Role Key, אבל אם ה-key לא מוגדר, זה ייכשל בשקט.

**בדיקה נדרשת:**
- לוודא ש-`SUPABASE_SERVICE_ROLE_KEY` מוגדר ב-Secrets
- להוסיף לוגים טובים יותר לקריאה ל-generate-illustrations

### שלב 4: הוספת Error Handling משופרת ב-GeneratingStep

הבעיה: ה-frontend לא מציג הודעות שגיאה מפורטות כאשר הקריאה ל-Edge Function נכשלת.

**הפתרון:**
- לתפוס שגיאות ספציפיות מה-Edge Function
- להציג הודעות שגיאה ברורות למשתמש
- להוסיף timeout handling

---

## פירוט טכני לכל קובץ

### 1. `src/hooks/use-signed-urls.ts`

שינויים נדרשים:
- שיפור ה-`extractPathFromUrl` לטפל בכל פורמטי ה-URL
- הוספת fallback כאשר לא ניתן לחלץ נתיב
- הוספת לוגים לדיבאג

### 2. `supabase/functions/get-signed-illustration-url/index.ts`

שינויים נדרשים:
- הרחבת ה-validation להיות גמיש יותר
- הוספת ניסיון לחלץ נתיב מ-URL מלא
- לוגים משופרים

### 3. `supabase/functions/generate-story/index.ts`

שינויים נדרשים:
- הוספת בדיקה ש-`SUPABASE_SERVICE_ROLE_KEY` קיים
- לוגים משופרים לקריאה ל-generate-illustrations
- טיפול בכישלון הקריאה ל-generate-illustrations

### 4. `src/components/wizard/GeneratingStep.tsx`

שינויים נדרשים:
- טיפול טוב יותר בשגיאות מה-Edge Function
- הצגת הודעות שגיאה ספציפיות
- הוספת timeout ו-retry logic

---

## בדיקות חובה לאחר התיקון

1. **בדיקת סיפורים קיימים** - לוודא שתמונות מסיפורים ישנים עם URLs מלאים נטענות
2. **בדיקת יצירת סיפור חדש** - לוודא שהתהליך מתחיל ועד הסוף עובד
3. **בדיקת לוגים** - לוודא שיש לוגים ב-generate-story וב-generate-illustrations

---

## הערה חשובה לגבי ה-Supabase Project

הפרויקט הזה מחובר ל-Lovable Cloud עם Project ID `qvdwmkxviaqcgmjotsxe`. **לא ניתן לשנות את החיבור** לפרויקט Supabase חיצוני (`xqoxoxxyfimlbekfjxo`). כל ה-Secrets (כולל `OPENAI_API_KEY`) חייבים להיות מוגדרים ב-Lovable Cloud דרך Settings → Cloud → Secrets.

**הסודות שקיימים כרגע:**
- ✅ `LOVABLE_API_KEY` (אוטומטי)
- ✅ `OPENAI_API_KEY` (הוגדר)
- ✅ `RESEND_API_KEY`

**חסר (ייתכן):**
- `SUPABASE_SERVICE_ROLE_KEY` - צריך לוודא שזה מוגדר, כי הוא נדרש לקריאה ל-generate-illustrations
