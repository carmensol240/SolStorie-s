## מטרה
להוסיף ללוח הבקרה של האדמין כרטיס שמציג את הסטטוס של Netlify לחודש הנוכחי: Build minutes, Bandwidth, וסטטוס ה-deploy האחרון.

## שלבי ביצוע

### 1. Secrets
לבקש מהמשתמש להוסיף שלושה secrets:
- `NETLIFY_API_TOKEN` — Personal Access Token
- `NETLIFY_ACCOUNT_ID` — מזהה ה-account/team ב-Netlify
- `NETLIFY_SITE_ID` — מזהה האתר (עבור deploy status)

### 2. Edge Function חדשה: `admin-netlify-status`
קובץ חדש: `supabase/functions/admin-netlify-status/index.ts`

מבנה זהה ל-`admin-service-health` הקיימת:
- אימות `Authorization: Bearer` ובדיקת `has_role(user_id, 'admin')` דרך service role client
- אם לא admin — 403
- שלוש קריאות מקבילות ל-Netlify API:
  1. `GET https://api.netlify.com/api/v1/accounts/{NETLIFY_ACCOUNT_ID}` — מחזיר `capabilities.build_minutes` ו-`capabilities.bandwidth` (used/included, period_start/end)
  2. `GET https://api.netlify.com/api/v1/sites/{NETLIFY_SITE_ID}/deploys?per_page=1` — סטטוס deploy אחרון (state, created_at, deploy_time, branch)
- כותרת `Authorization: Bearer ${NETLIFY_API_TOKEN}`
- החזרת JSON:
  ```json
  {
    "build_minutes": { "used": 123, "included": 300, "period_end": "..." },
    "bandwidth": { "used_bytes": ..., "included_bytes": ..., "period_end": "..." },
    "last_deploy": { "state": "ready", "created_at": "...", "deploy_time": 42, "branch": "main", "url": "..." },
    "errors": { ... }
  }
  ```
- כל קריאה עטופה ב-try/catch, נכשלת בצורה רכה (מחזירה `error` בשדה הרלוונטי במקום להפיל הכל)

### 3. כרטיס חדש ב-`ServiceHealthSection.tsx`
תוספת לקובץ `src/components/admin/ServiceHealthSection.tsx`:
- State חדש: `netlify` + fetch ב-`useEffect` שכבר קיים (ריענון כל 30 שניות) — קריאה ל-`supabase.functions.invoke("admin-netlify-status")`
- כרטיס חדש בגריד (יורחב ל-5 עמודות ב-lg, או יישאר 4 ויעבור לשורה שנייה):
  - אייקון: `Rocket` או `Globe` מ-lucide-react
  - **Build minutes**: פס התקדמות (used/included), אזהרה אדומה מעל 90%
  - **Bandwidth**: מספר ב-pretty bytes (used / included) — שימוש חוזר בפונקציה `prettyBytes` הקיימת בקובץ
  - **Last deploy**: badge עם צבע לפי `state` (ready=ירוק, building=צהוב, error=אדום) + זמן יחסי (`formatDistanceToNow`)
  - `StatusBadge` קיים — שימוש חוזר עם `warn` כאשר minutes > 90% או deploy state = error

### 4. בדיקה
- אחרי deploy של ה-Edge Function: `curl_edge_functions` לכרטיס כדי לוודא שהמבנה תקין
- בדיקה בדפדפן ב-`/admin/dashboard` שהכרטיס נטען ומציג נתונים

## פרטים טכניים

**Netlify API endpoints מאומתים:**
- `GET /api/v1/accounts/{account_id}` — מחזיר `capabilities: { build_minutes: { included, used, period_start, period_end }, bandwidth: { included, used, ... } }`
- `GET /api/v1/sites/{site_id}/deploys?per_page=1` — מערך deploys, ה-`[0]` הוא האחרון

**אין שינויים ב-DB.** אין שינויים ב-RLS. אין שינויים בקבצים אחרים מלבד `ServiceHealthSection.tsx` והוספת ה-Edge Function החדשה.
