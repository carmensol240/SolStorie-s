## תיקון שתי בעיות בדף הרכישה

### בעיה 1 — כפתור "רק הסיפור הזה — 19.90₪" לא מחבר לתשלום

**מצב כיום:** הכפתור ב-`DemoLockModal.tsx` מנווט ל-`/upgrade?firstStory=...&mode=single`, אבל `Upgrade.tsx` מתעלם מ-`mode=single`. אין UI ייעודי, אין PayPal, אין כלום — המשתמש פשוט נוחת בדף החבילות הרגיל.

ב-`verify-purchase` כבר קיים `packageId: 'single_story'` במיפוי, וב-DB יש טבלת `story_unlocks` עם `unlock_type='single'` ו-`StoryViewer` כבר בודק שחרור בודד דרכה. כל מה שחסר הוא חיבור ה-UI + הוספת insert ל-`story_unlocks` בצד השרת.

**תיקון (קובץ: `src/pages/Upgrade.tsx`):**

1. לקרוא `mode` מה-URL: `const mode = searchParams.get('mode')`.
2. כש-`mode === 'single' && firstStoryId`:
   - להציג בלוק PayPal ייעודי (אותה תבנית כמו בלוק PayPal הקיים בשורות 502–530), במחיר `19.90₪`, עם הכותרת "רק הסיפור הזה".
   - להסתיר את רשת החבילות, כפתור ה-CTA התחתון, וקופון (לא רלוונטי לרכישה הבודדת).
3. ב-`onSuccess` של ה-PayPal הזה לקרוא לאותה `verifyPurchase(orderId, 'single_story', 19.90)` הקיימת, ולהעביר את `storyId: firstStoryId` בגוף הבקשה.
4. ב-success → להציג `PurchaseSuccessModal` ולנווט בחזרה אל הסיפור (`/story/${firstStoryId}`).

**תיקון (קובץ: `supabase/functions/verify-purchase/index.ts`):**

1. לקבל `storyId` אופציונלי מה-body.
2. כש-`packageId === 'single_story'` ויש `storyId`: להכניס שורה ל-`story_unlocks` (`user_id`, `story_id`, `unlock_type='single'`, `amount_paid=amount`) באמצעות ה-service role client הקיים (`supabase` שכבר נוצר עם service key). הטבלה כבר מאפשרת זאת דרך "Service role manages unlocks".

לא נוגעים בעיצוב, במחיר, או בכפתורי החבילות הקיימים (79/199/279).

### בעיה 2 — RLS חוסם עדכון `daily_edit_credits`

**מצב כיום:** ה-policy `"Users can update their own profile"` על `public.profiles` כולל `WITH CHECK` שדורש שכל שדה רגיש (כולל `daily_edit_credits` ו-`last_edit_credits_reset`) יישאר זהה לערך הקיים. זה נכפה גם על service_role ב-flows מסוימים, ובנוסף קיים כבר טריגר `prevent_profile_privilege_escalation` שמגן על כל אותם שדות בדיוק — אז ה-WITH CHECK הזה כפול ויוצר את ה-false-positive.

**מיגרציה:**

```sql
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

הגנת ה-privilege escalation על `daily_edit_credits`, `story_credits`, `is_subscriber` וכו' נשארת בעינה דרך הטריגר `prevent_profile_privilege_escalation` (שבודק את `auth.jwt() ->> 'role' = 'service_role'` ומאפשר רק ל-service role לעדכן את השדות הללו). אין שום regression באבטחה.

לא משנים שום policy אחרת ולא שום טבלה אחרת.