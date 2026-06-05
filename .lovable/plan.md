## Goal
Make it structurally hard to ship a new `public` table without RLS, grants, and policies — so future schema work is secure by default instead of secure by remembering.

## Approach: 4 complementary layers

### Layer 1 — Database event trigger (auto-lockdown)
Create a `public` event trigger that runs on every `CREATE TABLE` in `public` and:

```sql
CREATE OR REPLACE FUNCTION public.auto_secure_new_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', obj.object_identity);
    EXECUTE format('REVOKE ALL ON %s FROM anon, authenticated', obj.object_identity);
    -- service_role keeps full access via its own GRANT below
    EXECUTE format('GRANT ALL ON %s TO service_role', obj.object_identity);
  END LOOP;
END;
$$;

CREATE EVENT TRIGGER auto_secure_new_table_trg
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION public.auto_secure_new_table();
```

Result: a new table created with no policies returns zero rows to anon/authenticated until we add explicit grants + policies. service_role (edge functions, admin scripts) still works out of the box.

Risks / caveats:
- Existing migration patterns must still include explicit GRANT + POLICY blocks. The trigger only prevents the "forgot to enable RLS" footgun; it does NOT write your policies for you.
- `FORCE RLS` means even the table owner is subject to policies. If any current migrations rely on owner-bypass, we should validate before enabling FORCE. Safe alternative: enable only `ENABLE ROW LEVEL SECURITY` (not FORCE).
- Event triggers run as superuser; the function should be minimal and audited.

### Layer 2 — Standard policy templates
Add a `.lovable/templates/secure-table.sql` (or memory entry) with copy-paste recipes for the 3 most common table shapes in this project:

1. **Owner-scoped table** (most common): `auth.uid() = user_id` for select/insert/update/delete, plus admin override, plus service_role.
2. **Admin-only table** (logs, audit): SELECT only via `has_role(auth.uid(),'admin')`, INSERT only via service_role.
3. **Public-read table** (catalog, premium_stories): SELECT to `anon, authenticated` with a column filter (e.g. `is_active=true`), writes admin-only.

Each template includes the matching GRANT block and a comment block reminding the author to think about anon access.

### Layer 3 — Mandatory post-migration linter run
Adopt a workflow rule (and add it to project memory):
> After any migration that touches schema, run `supabase--linter` and resolve every WARN/ERROR before moving on.

The linter already detects:
- Tables with RLS disabled
- Overly permissive policies
- SECURITY DEFINER functions exposed to anon/authenticated
- Functions with mutable search_path

We can additionally run `security--run_security_scan` for the scanner-level findings (the ones the user just resolved).

### Layer 4 — Memory rule reinforcement
Update `mem://core` with a single non-negotiable line:

> Every new `public` table migration MUST follow: CREATE → GRANT → ENABLE RLS → POLICY, plus a `supabase--linter` run at the end. The `auto_secure_new_table_trg` event trigger is a backstop, not a substitute.

## Deliverables
1. New migration that installs `auto_secure_new_table()` + event trigger.
2. `.lovable/templates/secure-table.sql` with the 3 standard templates.
3. Memory update under `mem://security/database-access-control` describing the new workflow + event trigger behavior.
4. (Optional, recommended) Run `supabase--linter` now to surface any current tables that would benefit from tightening.

## Open question
Do you want `FORCE ROW LEVEL SECURITY` (strict — even table owner respects RLS) or just `ENABLE ROW LEVEL SECURITY` (standard — owner bypasses, edge functions use service_role which bypasses anyway)?

Recommendation: **ENABLE only**, not FORCE. FORCE can break legitimate admin SQL run via `psql` as the database owner. ENABLE + the existing service_role pattern is already enough to lock out anon/authenticated.
