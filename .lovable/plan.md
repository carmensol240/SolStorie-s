

## Plan: Upgrade Admin Dashboard Tabs

### Summary
Enrich the Users, Stories, and Errors tabs with additional columns, and add a "Today's Errors" stats card with a red count.

### Changes — `src/pages/AdminDashboard.tsx` only

#### 1. Update `StoryRow` interface
Add `generation_status`, `user_id` fields (user_id already exists). Update the stories fetch query to include `generation_status`.

#### 2. Stories fetch query
Change `.select("id, child_name, topic, created_at, user_id")` to include `generation_status`.

#### 3. Users tab — add columns
Add "מספר סיפורים" (story count) and "רכש" (has purchases) columns. Data is already available: count stories by `user_id`, check if user has any purchase in `purchases` array.

Current columns: שם, אימייל, תפקיד, קרדיטים, מנוי, שגיאות, הצטרפות, פעולות
New columns: שם, אימייל, תפקיד, סיפורים (count), רכש (yes/no), קרדיטים, מנוי, שגיאות, הצטרפות, פעולות

#### 4. Stories tab — add columns
Add: שם משתמש + מייל (resolve from profiles array using `user_id`), and סטטוס (from `generation_status`: "ready" = הושלם, otherwise = נכשל).

Current columns: נושא, תאריך
New columns: משתמש (name + email), נושא, תאריך, סטטוס

#### 5. Errors tab — add user email column
Resolve `user_id` to email using the profiles email map (already loaded). Add מייל column.

Current columns: סוג, הודעה, תאריך
New columns: מייל, סוג, הודעה, תאריך

#### 6. Stats cards — add "שגיאות היום"
Add a card showing today's error count (since midnight, not 24h) with red styling. Currently there's "שגיאות 24ש" — replace it or add alongside. Since the request says "שגיאות היום", I'll update the existing 24h card to be "today" (since midnight) and ensure the red number styling.

Actually, looking again — the existing card already shows 24h errors with red styling. The request says to add a "שגיאות היום" card. I'll keep the existing one but rename it to "שגיאות היום" and change the calculation to today (since start of day) for clarity.

### Technical details
- No new data fetches needed — profiles already have emails, stories have user_id, error_logs have user_id
- Story status derived from `generation_status` field ("ready" = completed)
- Email map from `get_admin_user_emails` RPC is already stored in profiles
- `colSpan` values updated to match new column counts

