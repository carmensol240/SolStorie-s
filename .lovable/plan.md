## הבעיה

הקרדיט לא עולה אחרי רכישה, ומסך הספרייה לא מתעדכן אוטומטית.

שני באגים מאחורי זה:

1. **בקצה האחורי (`verify-purchase`)** — מסך השדרוג שולח `packageId: "single_story_digital"` או `"single_story_full"`, אבל `packageConfig` יודע רק על `"single_story"` (וגם הוא מוגדר עם `stories: 0`). התוצאה: כל רכישה נדחית כ-"Unknown package", או — אם בכלל עוברת — לא מוסיפה קרדיט סיפור.
2. **במסך הספרייה** — `useCredits` נטען פעם אחת ולא מאזין לאירוע `purchase-completed` ש-`Upgrade.tsx` כבר משדר. ל-`StoryViewer` יש מאזין כזה, ל-`Library` אין.

## מה לבנות

### 1. `supabase/functions/verify-purchase/index.ts`
- להוסיף ל-`packageConfig`:
  - `single_story_digital: { stories: 1, freeEdits: 1, coloringPages: 0 }`
  - `single_story_full:    { stories: 1, freeEdits: 1, coloringPages: 1 }`
- כך כל רכישה = קרדיט סיפור אחד נוסף לפרופיל. הזיכוי נעשה ב-DB (`profiles.story_credits += 1`), אטומי ובלתי תלוי ברענון לקוח.
- להחזיר בתגובה `credits.storyCredits` החדש (כבר קיים) — נשתמש בלקוח לעדכון מיידי.

### 2. `src/hooks/use-credits.ts`
- להוסיף `useEffect` שמאזין ל-`window` event `purchase-completed` ומפעיל `fetchCredits()`. כך **כל** מסך שמשתמש ב-hook (Library, StoryViewer, Home וכו') יתעדכן מיד אחרי רכישה — בלי לגעת בכל מסך בנפרד.
- בנוסף: לרענן אוטומטית כש-טאב המסמך חוזר לפוקוס (`visibilitychange`) — שומר על סנכרון גם אחרי חזרה מ-PayPal בחלון אחר.

### 3. `src/pages/Upgrade.tsx`
- ב-`handleTestPurchase` (וכל מסלול רכישה עתידי) — אחרי `refetchCredits()` כבר משדר `purchase-completed`. נוודא שזה נשאר, ושנקרא לזה **אחרי** שהשרת אישר ולא רק אופטימית.
- אופציונלי: אם הרספונס מכיל `credits.storyCredits`, להציג ב-`PurchaseSuccessModal` את הערך המעודכן (במקום הקבוע `creditsAdded={1}` — נשאיר 1 כי זה אכן 1 לרכישה).

### פרטים טכניים

- אין שינוי סכמה — `profiles.story_credits` כבר קיים והעדכון נעשה ע"י service role (עוקף את ה-trigger `prevent_profile_privilege_escalation`).
- האירוע `purchase-completed` הוא `CustomEvent` קיים; ההאזנה ב-hook נעשית פעם אחת ומסונכרנת בין מסכים באותו tab.
- אין צורך ב-Realtime/Postgres changes — האירוע מתפעל בצד הלקוח ברגע שה-Edge Function מחזיר הצלחה.

### בדיקות ידניות

1. עם משתמש הטסט (`carmit1901+test@gmail.com`) ללחוץ "רכשו" → לאשר במודאל הסיכום → לוודא ש-`story_credits` עלה ב-1 ב-DB.
2. לחזור לספרייה → ה-Pill "סיפורים זמינים" עלה ב-1 מיד, בלי refresh.
3. רכישה שנייה → +1 נוסף, מצטבר.