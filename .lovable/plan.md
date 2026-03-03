

## אבחון: בעיית RLS בטבלת stories

### הבעיה
כל מדיניות ה-SELECT בטבלת `stories` מוגדרות כ-**RESTRICTIVE** (לא permissive). בפוסטגרס:
- מדיניות **PERMISSIVE** — מספיק שאחת תעבור (OR)
- מדיניות **RESTRICTIVE** — כולן חייבות לעבור (AND)
- **אם אין מדיניות permissive כלל**, הגישה נחסמת לחלוטין כברירת מחדל

המצב הנוכחי: שלוש מדיניויות SELECT, כולן restrictive:
1. `Deny anonymous access` — `USING (false)` ← חוסמת את כולם
2. `Users can view their own stories` — `USING (auth.uid() = user_id)`
3. `Admins can view all stories` — `USING (has_role(...))`

כיוון שכולן restrictive ו-AND ביניהן, מדיניות #1 (`false`) חוסמת את כולם — כולל בעלי הסיפורים. ייתכן שזה גורם לבאגים או שהאפליקציה עוקפת את ה-RLS בצורה לא מכוונת.

### התיקון
נבצע migration שמסיר את שלוש מדיניויות ה-SELECT הקיימות ויוצר אותן מחדש נכון:

1. **`Users can view their own stories`** — **PERMISSIVE** — `USING (auth.uid() = user_id)`
2. **`Admins can view all stories`** — **PERMISSIVE** — `USING (has_role(auth.uid(), 'admin'))`
3. **`Deny anonymous access`** — **RESTRICTIVE** — `USING (auth.role() = 'authenticated')`

כך: מדיניויות permissive (#1 ו-#2) מאפשרות גישה למשתמש שרואה את שלו **או** אדמין. מדיניות restrictive (#3) מוודאת שמשתמש אנונימי לא עובר בשום מקרה.

### קובץ אחד
- **Migration SQL** — `DROP POLICY` × 3, `CREATE POLICY` × 3 על `public.stories`

