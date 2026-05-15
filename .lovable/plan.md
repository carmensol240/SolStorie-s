## Goal
Add a new **Service Health** section at the top of `AdminDashboard.tsx` showing the status of 4 critical services. Nothing else in the dashboard changes.

## New edge function: `admin-service-health`

Single admin-only function (verifies caller is admin via `has_role`) that returns:

```json
{
  "db": { "size_bytes": 123456789, "size_pretty": "117 MB", "limit_bytes": 8589934592 },
  "resend": { "sent_this_month": 1234, "ok": true, "error": null }
}
```

- **DB size**: uses `SUPABASE_SERVICE_ROLE_KEY` to run `SELECT pg_database_size(current_database())`. Limit comes from a constant in the function (default 8 GB free tier — easy to update).
- **Resend**: calls `GET https://api.resend.com/emails?limit=100` (paginated until older than the 1st of current month) using `RESEND_API_KEY`, counts items where `created_at >= startOfMonth`. If Resend API fails, returns `ok: false` and the error message — the UI falls back to showing only error counts.

Edge function is registered with default settings (no config.toml change needed).

## Frontend changes — `src/pages/AdminDashboard.tsx`

Add a new component block rendered **above the existing tabs / KPI grid**, after the page header. No existing UI is removed or restructured.

Data sources:

| Card | Data source |
|------|-------------|
| **Lovable AI Gateway** | Derived from existing `errorLogs` already in state. Filter where `error_message` contains `402` OR `"credits"` OR `"quota"`. Show: last 402 timestamp (relative + absolute), count in last 24h, count in last 7d. |
| **Fal.ai** | Last usage: max `created_at` from existing `illustrationLogs` where `model_used` ILIKE `%fal%`. Errors: count in `errorLogs` where `error_type = 'illustration_fal_error'` in last 24h / 7d. |
| **Supabase DB** | From new `admin-service-health` edge function. Show `size_pretty` + a progress bar `size_bytes / limit_bytes`, percentage. |
| **Resend** | From edge function: `sent_this_month`. If `ok=false`, show "Stats unavailable" + error tooltip. |

Each card:
- Title + small icon
- 1–2 stat lines
- A red badge **"⚠️ Errors in last 24h"** when its 24h error count > 0 (AI Gateway, Fal.ai), or when DB usage > 90%, or when Resend `ok=false`.
- Otherwise a green "Healthy" badge.

Layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6`, using existing `<Card>` from `@/components/ui/card` and `<Badge>` — matches the dashboard's current style.

A single `useEffect` calls `supabase.functions.invoke('admin-service-health')` once on mount and refreshes alongside the existing 30s `fetchAllData` interval (piggybacks on it via a `serviceHealth` state setter inside `fetchAllData`, so no second timer).

## What stays exactly the same
- All existing tabs, KPI cards, tables, filters, realtime subscriptions, trash/reviewed logic.
- No DB schema changes, no RLS changes.
- No changes to other pages or any business logic.

## Out of scope (per chosen options)
- No live AI Gateway balance API call (none available) — relies on `error_logs`.
- No new `email_send_log` table — Resend totals come from Resend's own API.
