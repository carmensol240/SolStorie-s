

## Plan: Redesign Admin Dashboard

### Overview
Complete rewrite of `src/pages/AdminDashboard.tsx` with auto-refresh, cleaner tabs (users/stories/purchases/errors), better error categorization, search/filter on every table, and responsive design with green/orange/red status colors.

### Single file changed: `src/pages/AdminDashboard.tsx`

### Key Changes

**1. Auto-refresh every 30 seconds + "Last updated" timestamp**
- Add `lastUpdated` state, display formatted time in header
- `useEffect` with `setInterval(fetchAllData, 30000)` that re-fetches all data
- Visual indicator showing countdown to next refresh

**2. Tabs restructured to 4 main tabs + 3 secondary**
- Primary: **משתמשים** | **סיפורים** | **רכישות** | **שגיאות**
- Secondary (smaller): איורים | כריכות | קופונים | משובים
- Each tab gets a search input (`Input`) that filters rows by text match

**3. Purchases tab (new dedicated tab)**
- Table columns: שם משתמש, אימייל, סוג חבילה, סכום (₪), תאריך, סטטוס
- Status badge: green "הצלחה" / red "נכשל" / orange "ממתין"
- Fetch ALL purchases (not just completed) to show failures too
- New purchase alert: highlight rows from last 30 minutes with a subtle animation

**4. Errors tab improvements**
- Replace raw error_type with human-readable Hebrew explanation
- Add category filter: יצירת סיפור / איורים / רכישה / התחברות / הכל
- Each error row shows: user email, what happened (translated), at which step, timestamp
- For "AI Gateway 402" errors: show "נגמרו קרדיטי AI — יש להוסיף יתרה בהגדרות"

**5. Users tab improvements**
- Columns: שם מלא, אימייל, הצטרפות, סיפורים, קרדיטים (story+coloring+editing), רכישה אחרונה
- "פעילים היום" counter in stats cards (users who created stories today)
- Search by name or email

**6. Stories tab improvements**
- Stats cards above table: נוצרו היום, נוצרו השבוע, נכשלו, זמן ממוצע
- Failed stories show reason from error_logs
- Table: user name, email, topic, date, status (green/red), generation time

**7. Stats cards redesign**
- Color-coded: green border for healthy metrics, orange for warnings, red for errors
- Add "פעילים היום" card
- Add "עודכן לאחרונה: HH:MM" in header

**8. Responsive design**
- Stats cards: 2 cols mobile, 3 cols tablet, 6 cols desktop (existing)
- Tab list: scrollable horizontally on mobile
- Tables: horizontal scroll with sticky first column on mobile
- Search inputs full-width on mobile

**9. Search & filter**
- Each tab gets `searchQuery` state
- Filter rows by matching search text against name, email, topic, error message
- Debounced input for performance

### Implementation approach
- Rewrite the entire component keeping the same auth/admin check logic
- Keep existing data fetching patterns but consolidate into one `fetchAllData` function
- Keep ReviewedBar component and mark-as-reviewed logic
- Keep ADMIN_EMAILS and EXCLUDED_IDS filtering
- Keep all existing interfaces

### What stays the same
- Auth check and admin role verification
- All database queries and tables used
- ReviewedBar component
- No other files changed
- No database changes needed

