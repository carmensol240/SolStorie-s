## תיקון `isDemoUser` ב-`src/pages/StoryViewer.tsx`

### שינויים

**1. הוספת state חדש (ליד שורה 227):**
```ts
const [isAdminUser, setIsAdminUser] = useState(false);
```

**2. הוספת קבוע מיילי טסטר (בראש הקובץ):**
```ts
const TESTER_EMAILS = ['carmit1901@gmail.com', 'carmit1901+test@gmail.com'];
```

**3. הוספת useEffect לבדיקת admin (ליד הבדיקה הקיימת של subscriber, שורה ~381):**
```ts
useEffect(() => {
  if (!user?.id) { setIsAdminUser(false); return; }
  let cancelled = false;
  (async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!cancelled) setIsAdminUser(!!data);
  })();
  return () => { cancelled = true; };
}, [user?.id]);
```

**4. חישוב `isTester` ועדכון `isDemoUser` (שורה 397):**
```ts
const isTester = !!user?.email && TESTER_EMAILS.includes(user.email.toLowerCase());
const isDemoUser = !!user
  && !hasPurchasedPackage
  && !isSubscriberUser
  && !isAdminUser
  && !isTester;
```

### תוצאה
- מנהלות (`user_roles.role='admin'`) — פתוחות לגישה מלאה לכל הפיצ'רים.
- שני מיילי הטסטר — פתוחים לגישה מלאה.
- שאר המשתמשים — ממשיכים בלוגיקה הקיימת (רכישה / מנוי).

אישור להעברה ל-Build mode וביצוע השינוי?
