

## תחקור תקלת איורים + תיקונים

### שורש הבעיה: שגיאת 400 מ-AI Gateway

הלוגים מראים שכל 4 האיורים נכשלים עם HTTP 400, גם אחרי 3 ניסיונות חוזרים (סה"כ 12 קריאות). **הכריכה מצליחה** כי היא רצה לבד (קריאה אחת בכל פעם). האיורים רצים **כולם במקביל** (`Promise.allSettled`) — מה שגורם ל-4 קריאות בו-זמנית ל-AI Gateway, וכנראה חורג ממגבלת ה-rate limit.

בנוסף, הקוד לא מדפיס את תוכן ה-response body כשמתקבל 400, כך שהסיבה המדויקת (rate limit / content filter / payload too large) נבלעת.

### תיקון 1: הוספת לוג לגוף השגיאה (`generate-illustrations/index.ts`)

בשורה 292-294, במקום רק `console.error("Image generation failed:", response.status)` — קרוא גם את גוף התשובה:
```typescript
if (!response.ok) {
  const errorBody = await response.text().catch(() => "no body");
  console.error(`Image generation failed: ${response.status} - ${errorBody}`);
  return null;
}
```

### תיקון 2: ייצור איורים בסדרה (לא במקביל)

החלפת `Promise.allSettled` בלולאת `for...of` סדרתית עם השהייה של 3 שניות בין כל איור כדי למנוע rate limiting:

```typescript
for (const page of pagesToIllustrate) {
  // generate illustration for this page (with retry logic)
  // wait 3 seconds before next page
}
```

### תיקון 3: הוספת לוג לגוף השגיאה ב-`retry-illustration/index.ts`

אותו שינוי — הדפסת גוף השגיאה כדי לאבחן את הסיבה.

### PayPal — כבר ב-Live

ה-Client ID (`AffM7iJE3...`) הוא **כבר Live**. ה-Sandbox ID נשמר כהערה בלבד. אין צורך בשינוי.

### יישור וניווט — כבר תקין

חיצי הקשת הצבעוניים (gradient purple→pink→orange, 56x56px) כבר מוגדרים. כל הדפים כבר top-aligned.

### סיכום שינויים

| קובץ | שינוי | Deploy |
|-------|--------|--------|
| `generate-illustrations/index.ts` | הוספת error body log + מעבר לייצור סדרתי (לא מקביל) | כן |
| `retry-illustration/index.ts` | הוספת error body log | כן |

