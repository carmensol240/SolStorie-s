# בדיקת מבצע 1+1 (סיפור דיגיטלי + סיפור נוסף במתנה)

## מה מצאתי בקוד היום

**איך המערכת מזהה "משתמש חדש"?**
לפי **חשבון המשתמש המחובר** (`user.id` בטבלת `profiles` / `purchases`) — לא לפי אימייל ולא לפי מכשיר. משתמש שמתנתק ופותח חשבון חדש עם אימייל אחר ייחשב חדש; משתמש שמתחבר לחשבון קיים לא.

**האם יש בדיקה בפועל שמונעת ניצול חוזר?**
חלקית. יש שתי שכבות שונות והן לא מסונכרנות:

1. **צד שרת (`supabase/functions/_shared/purchase-credits.ts`)** — כשהחבילה היא `single_story`, הקוד סופר רכישות קודמות של המשתמש בטבלת `purchases` (סטטוס `completed`/`test_completed`). אם `priorCount === 0` — מוסיף +1 סיפור ו-+1 עריכה. **זו ההגנה האמיתית בפועל** — משתמש חוזר לא יקבל כפילות של הקרדיטים.
2. **צד לקוח (`src/components/story/DemoLockModal.tsx`)** — מציג את הטקסט "+ סיפור דיגיטלי נוסף במתנה 🎁" רק אם `profiles.first_purchase_bonus_given === false`.

**הבאג/החולשה:** נתיב הבונוס ב-`purchase-credits.ts` **לא מסמן** את `first_purchase_bonus_given = true` אחרי שהוענק הבונוס. הדגל מתעדכן רק ב-Edge Function נפרד (`grant-first-purchase-bonus`) שלא נקרא בזרימת הרכישה של `single_story`. התוצאה:
- משתמש שרכש כבר `single_story` וקיבל את הבונוס — יראה **שוב** את הטקסט "+ סיפור נוסף במתנה" בפופ-אפ.
- אם ילחץ ויקנה שוב — ה-backend כן יחסום את הבונוס (`priorCount>0`), אבל הוא ישלם 39.90 ₪ בציפייה לקבל 2 סיפורים ויקבל רק אחד. חוויה שגויה + טענה לגיטימית להחזר.

בנוסף, כל שאר החבילות (`popular`, `single_story_digital`, `single_story_full`, `basic` וכו') לא מפעילות מבצע 1+1 בכלל — רק המפתח `single_story` דרך הלינק `singleStory` ב-`grow-links`.

## מה אני מציע לשנות (הידוק ההגבלה)

מטרה: להבטיח שהבונוס יוענק **פעם אחת בלבד לכל חשבון**, ושה-UI תמיד יתאים למצב האמיתי.

1. **`supabase/functions/_shared/purchase-credits.ts`** — בבלוק `if (config.firstPurchaseBonus)`:
   - להוסיף בדיקה נוספת שקוראת מ-`profiles.first_purchase_bonus_given`. אם כבר `true` — לא להעניק בונוס (גם אם `priorCount===0` מסיבה כלשהי).
   - אם הבונוס אכן הוענק — להוסיף `updates.first_purchase_bonus_given = true` כך שיישמר יחד עם עדכון הקרדיטים באותה טרנזקציה של `update profiles`.

2. **`src/components/story/DemoLockModal.tsx`** — להשאיר את הבדיקה הקיימת על `first_purchase_bonus_given`. אחרי שינוי 1, הדגל יהיה מדויק והטקסט "+ סיפור נוסף במתנה" ייעלם אוטומטית ממשתמשים שכבר ניצלו.

3. **הגנה נוספת (defense-in-depth)** — לוודא שהתנאי `priorCount === 0` נשאר גם הוא, כך שגם אם הדגל אבד מסיבה כלשהי, לא יינתן בונוס כפול.

4. **אין שינוי** ב-`grant-first-purchase-bonus` (Edge Function הנפרד) ואין שינוי בשאר החבילות — המבצע נשאר מוגבל לחבילת `single_story` בלבד, כמו היום.

## פרטים טכניים

- הדגל `education_bonus_claimed` (הטבת אנשי חינוך) לא מושפע — הוא כבר עובד נכון דרך `handle_new_user`.
- מיגרציית DB לא נדרשת — העמודה `first_purchase_bonus_given` כבר קיימת ב-`profiles` וה-trigger `prevent_profile_privilege_escalation` כבר מרשה עדכון שלה דרך `service_role` (שזה מה ש-`purchase-credits.ts` משתמש בו).
- הבדיקה נעשית לפי `user_id` בלבד. אם רוצים חסימה גם לפי אימייל/מכשיר (למניעת פתיחת חשבון חדש) — זה שינוי גדול יותר שדורש דיון נפרד; לא כלול בתוכנית זו.

