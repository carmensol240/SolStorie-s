

## ניתוח: צווארי בקבוק ונקודות כשל ביצירת סיפורים ואיורים

### מצב נוכחי — זרימת היצירה

```text
Client → generate-story Edge Function
           ├─ Auth + Credit check (~1s)
           ├─ Character profile extraction via AI (~5s, if photo)
           ├─ Story text generation via Gemini 2.5 Pro (~15-25s)
           ├─ Parse + Save to DB (~1s)
           ├─ Fire N illustration calls (one per odd page) → generate-illustrations
           ├─ Fire cover generation → generate-cover
           ├─ Background: nikud + summary (deferred)
           └─ Return storyId (~25-30s total)

Each generate-illustrations call:
           ├─ Fal.ai Instant Character or Flux Schnell (~30-60s)
           ├─ Upload to Storage
           └─ Update DB (Realtime pushes to client)
```

### נקודות כשל מזוהות

| בעיה | סיבה | השפעה |
|------|-------|--------|
| **"Failed to send a request to the Edge Function"** | קליטה חלשה / timeout ברשת הסלולרית | הבקשה לא מגיעה לשרת כלל |
| **Edge Function timeout (~150s)** | `Promise.allSettled` ממתין לכל ה-fetch calls | אם Fal.ai איטי, הפונקציה הראשית יכולה להגיע ל-timeout |
| **Nikud/Summary כ-fire-and-forget** | הם רצים כ-async IIFE בלי await | ה-runtime נסגר לפני שהם מסיימים — הטקסט נשאר ללא ניקוד |
| **אין exponential backoff** | ה-retry ב-client (GeneratingStep) משתמש ב-1.5s קבוע | בעיות זמניות לא מקבלות זמן להתאושש |
| **אין בדיקת חיבור מראש** | הלקוח שולח בקשה ללא בדיקת navigator.onLine | המשתמש מגלה את הבעיה רק אחרי 2 דקות |

### תוכנית שיפור

#### 1. בדיקת חיבור מקדימה (Client — GeneratingStep.tsx)
לפני שליחת הבקשה, בדוק `navigator.onLine` ו-`navigator.connection?.effectiveType`. אם החיבור חלש (2g/slow-2g) או לא קיים, הצג הודעה מיידית במקום לחכות ל-timeout.

#### 2. Exponential backoff ב-retry (Client — GeneratingStep.tsx)
שנה את ה-retry מ-1.5s קבוע ל-backoff: 2s, 5s, 10s. זה נותן לרשת ולשרת זמן להתאושש.

#### 3. תיקון fire-and-forget עבור nikud ו-summary (Server — generate-story)
כרגע nikud ו-summary רצים כ-async IIFE ללא await, מה שאומר שה-runtime נסגר לפניהם. הפתרון: להוסיף אותם ל-`fetchPromises` ולכלול אותם ב-`Promise.allSettled` הקיים, כך שהם ירוצו במקביל לאיורים אבל ה-runtime ימתין גם להם.

#### 4. Timeout קצר יותר על `Promise.allSettled` (Server — generate-story)
במקום לחכות לכל ה-illustration dispatches ללא הגבלה, עטוף את ה-`allSettled` ב-`Promise.race` עם timeout של 10 שניות. מספיק כדי לשלוח את ה-HTTP requests, אבל לא ייתקע אם Fal.ai לא עונה.

#### 5. Client-side keepalive/ping (Client — GeneratingStep.tsx)  
הוסף ping קל (HEAD request ל-Supabase health endpoint) כל 15 שניות בזמן ההמתנה. אם ה-ping נכשל, הצג הודעה "נראה שהחיבור לא יציב" לפני שמגיעים ל-timeout המלא.

### סיכום השינויים

| קובץ | שינוי |
|-------|-------|
| `src/components/wizard/GeneratingStep.tsx` | בדיקת חיבור מקדימה, exponential backoff, keepalive ping |
| `supabase/functions/generate-story/index.ts` | העברת nikud/summary ל-fetchPromises, timeout על allSettled |

שינויים אלה לא משנים את המודל (ממשיכים עם Lovable AI Gateway + Gemini), אלא משפרים את האמינות וחוויית המשתמש במצבי רשת לא יציבה.

