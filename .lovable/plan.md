## עדכון role לבדיקה

שינוי `user_role` ל-`educator` עבור המשתמש `carmit1901+test@gmail.com` בטבלת `profiles`.

```sql
UPDATE public.profiles
SET user_role = 'educator'
WHERE id = (SELECT id FROM auth.users WHERE email = 'carmit1901+test@gmail.com');
```

לאחר הבדיקה, אפשר להחזיר ל-`parent` באותו אופן.