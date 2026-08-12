# שינוי timeout ב-waitForPageOneIllustration

## שינוי מתוכנן
בקובץ `supabase/functions/generate-illustrations/index.ts`, בשורה 61, בחתימת הפונקציה `waitForPageOneIllustration`:

```typescript
async function waitForPageOneIllustration(
  supabase: any,
  storyId: string,
  maxWaitMs = 60_000,   // ← ישתנה ל-120_000
  intervalMs = 3_000,
): Promise<string | null> {
```

יש לשנות את ערך ברירת המחדל של `maxWaitMs` מ-`60_000` ל-`120_000`.

## מה לא נוגעים בו
- לא נשנה את `intervalMs` (נשאר 3,000ms).
- לא נשנה לוגיקת ההמתנה, לוגים, או החזרות.
- לא ניגע בקבצים אחרים או בפונקציות אחרות.

## סיבה
הגדלת חלון ההמתנה לעמוד 1 מ-60 ל-120 שניות, כדי לאפשר יצירת איור ראשון איטי יותר לפני שהדפים הבאים מתחילים בלי reference.
