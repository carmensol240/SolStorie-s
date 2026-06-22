
# עדכון קרדיטים בזמן אמת דרך Realtime Subscription

המטרה: להחליף את ה-polling (שבודק כל 2 שניות אחרי focus) במנגנון Realtime של Supabase שמאזין לשינויים בשורת ה-`profiles` של המשתמש המחובר. ה-polling יישאר כ-fallback בלבד.

## שינויים מתוכננים

### 1. מיגרציה — הפעלת Realtime על `profiles`
```sql
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```
(REPLICA IDENTITY FULL כדי שנקבל את ערכי old + new של כל העמודות, נדרש להשוואת deltas.)

מדיניות ה-RLS הקיימת על `profiles` (משתמש קורא את הרשומה של עצמו) כבר מבטיחה שמשתמש יקבל אך ורק עדכונים על השורה שלו.

### 2. `src/components/paywall/GlobalPurchaseHandler.tsx`
- להוסיף `useEffect` שמרשם channel ל-`postgres_changes` עם:
  - `event: 'UPDATE'`, `schema: 'public'`, `table: 'profiles'`, `filter: id=eq.${user.id}`
- בכל עדכון: להשוות `story_credits / coloring_credits / editing_credits / is_subscriber` בין `payload.old` ל-`payload.new`.
- אם יש delta חיובי או `is_subscriber` הפך ל-true:
  - לשגר `purchase-completed` ו-`coloring-credits-updated` (כדי שכל ההוקים הקיימים יתרעננו).
  - אם `growCheckoutPending` קיים ב-sessionStorage — לנקות אותו, לפתוח את `PurchaseSuccessModal` עם ה-delta הגדול ביותר.
  - אם אין pending — עדיין לשגר את האירועים (כדי שספירת הקרדיטים בכותרת תתעדכן מיידית), בלי לפתוח מודאל.
- ניקוי: `supabase.removeChannel(channel)` ב-cleanup, כדי למנוע חיובי Realtime מצטברים.
- ה-polling הקיים נשאר כ-fallback (למקרה ש-WebSocket חסום ע"י רשת/דפדפן), אבל עם backoff פחות אגרסיבי: ננסה פעם אחת מיד בחזרה לפוקוס, ואז כל 5 שניות עד 30 שניות במקום 2 שניות × 20.

### 3. `src/hooks/use-credits.ts`
- האזנה ל-`purchase-completed` כבר קיימת — תמשיך לעבוד כי ה-handler החדש משגר את אותו אירוע.
- אופציונלי: להוסיף subscription מקומי קצר לאותה שורה כדי לעדכן את ה-state בלי round-trip נוסף ל-DB. נשאיר את הקיים (refetch על האירוע) כדי לא לכפול channels — עדיף channel אחד מרכזי ב-`GlobalPurchaseHandler`.

### 4. ללא שינוי
- `verify-purchase` / `grow-webhook` / `purchase-credits.ts` — הם כבר מעדכנים את `profiles`, וה-Realtime יתפוס את ה-UPDATE אוטומטית.
- `use-coloring-credits` / `use-editing-credits` / `use-subscription` ממשיכים להאזין לאירועים הגלובליים הקיימים.

## הערות טכניות
- Channel יחיד פר-משתמש ב-handler גלובלי = עלות Realtime מינימלית.
- Filter ב-`postgres_changes` מבוצע בצד השרת — לא נחשפים שינויים של משתמשים אחרים.
- `REPLICA IDENTITY FULL` מעט יותר יקר ב-WAL אבל `profiles` קטנה ומתעדכנת נדירות, אז ההשפעה זניחה.
- Fallback ה-polling נשמר כדי לא לשבור משתמשים מאחורי פרוקסי שחוסם WebSocket.

## בדיקות אחרי היישום
1. רכישה אמיתית/test → לאמת שהמודאל נפתח תוך < 2 שניות (לפני זה היה עד 40 שניות עם polling).
2. שינוי ידני של `story_credits` ב-DB → לוודא שהכותרת מתעדכנת בלי refresh.
3. ניתוק רשת ל-WebSocket → לוודא ש-polling fallback עדיין עובד.
