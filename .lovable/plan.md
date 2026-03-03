

## תוכנית: Error Monitoring בלוח הבקרה

### 1. יצירת טבלת `error_logs` במסד הנתונים
אין טבלה קיימת. ניצור טבלה חדשה:

```sql
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_type text NOT NULL,
  error_message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only service_role can insert (from Edge Functions)
CREATE POLICY "Service role can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');
```

### 2. רישום שגיאות מה-Edge Functions
נוסיף פונקציית עזר `logError` ב-`generate-illustrations/index.ts` וב-`generate-story/index.ts` שכותבת ל-`error_logs` בנקודות הכשל הקריטיות:
- Timeout בקריאה ל-Fal.ai
- כשל ביצירת איור (response not ok)
- כשל בפענוח תגובת AI
- כשל ביצירת סיפור (insert error)
- שגיאות 429 (rate limit)

הפונקציה תשתמש ב-`supabaseAdmin` (service_role) שכבר קיים בשתי הפונקציות.

### 3. טאב חדש בלוח הבקרה
נוסיף ל-`AdminDashboard.tsx`:
- State חדש `errorLogs` + fetch מהטבלה
- TabsTrigger רביעי: "שגיאות ומעקב"
- TabsContent עם טבלה: סוג שגיאה, הודעה, תאריך, metadata
- סינון לפי `error_type` (Select) ולפי טווח תאריכים (7/30/all days)
- כרטיס סטטיסטיקה חדש עם מספר השגיאות ב-24 שעות אחרונות

### קבצים שישתנו
1. **Migration** — יצירת טבלת `error_logs` + RLS
2. `supabase/functions/generate-illustrations/index.ts` — הוספת `logError` בנקודות כשל
3. `supabase/functions/generate-story/index.ts` — הוספת `logError` בנקודות כשל
4. `src/pages/AdminDashboard.tsx` — טאב שגיאות + פילטרים + כרטיס סטטיסטיקה

