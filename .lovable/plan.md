## מטרה
משתמש עם `story_credits > 0` (למשל מקופון `extra_stories`) יוכל לקרוא סיפור דיגיטלי במלואו, בלי חסימה בעמוד 3.

## שינויים ב-`src/pages/StoryViewer.tsx`

### 1. הוספת state חדש
ליד `isSubscriberUser` / `subscriberChecked`:
```ts
const [hasStoryCredits, setHasStoryCredits] = useState(false);
```

### 2. הרחבת ה-useEffect בשורה 416
לשנות את ה-SELECT מ-`'is_subscriber'` ל-`'is_subscriber, story_credits'`, ולעדכן גם את `hasStoryCredits`:
```ts
const { data } = await supabase
  .from('profiles')
  .select('is_subscriber, story_credits')
  .eq('id', user.id)
  .maybeSingle();
if (!cancelled) {
  setIsSubscriberUser(!!data?.is_subscriber);
  setHasStoryCredits((data?.story_credits ?? 0) > 0);
  setSubscriberChecked(true);
}
```

### 3. שילוב ב-`isDemoUser` (שורות 473-476)
```ts
const isDemoUser = !!user && (
  isForcedDemo ||
  (!hasPurchasedPackage && !isSubscriberUser && !isAdminUser && !isTester && !hasStoryCredits)
);
```
`isForcedDemo` (מצב tester ידני) נשאר גובר — בודקי QA עדיין יוכלו לראות את החסימה.

### 4. רענון אחרי רכישה/קופון
ה-useEffect הזה תלוי ב-`user?.id` בלבד. כדי שאחרי מימוש קופון/רכישה הסטטוס יתעדכן בלי refresh, נוסיף האזנה לאירוע `purchase-completed` הקיים (וגם משדרים אותו ב-`CouponInput` אם עוד לא — לבדוק; אם לא משודר שם, נוסיף שידור אחרי מימוש מוצלח).

## הערות
- אין שינוי DB / RLS / Edge Functions.
- אין שינוי בלוגיקת `useCredit` — קרדיט נצרך רק ביצירת סיפור חדש, לא בקריאה. כלומר משתמש עם קרדיט אחד יוכל לקרוא חופשי גם אחרי שהשתמש בו ליצירה (כי `story_credits` יורד ל-0 רק אחרי יצירה). זה תואם להתנהגות של מנויים/קונים.
- אם תרצי התנהגות הפוכה — "פתוח רק אם הסיפור עצמו נוצר עם קרדיט" — צריך לסמן סיפורים בטבלת `stories` בעת יצירה (שינוי גדול יותר). התוכנית הנוכחית בוחרת בגישה הפשוטה.
