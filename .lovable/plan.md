## Goal
Fully remove the maintenance/coming soon banner from the codebase.

## Current state
The maintenance banner is already not displayed anywhere — the site loads the app directly. The only remnants are:
- `src/components/MaintenanceBlock.tsx` — the component file (orphaned, never rendered).
- `src/pages/CreateStory.tsx` line 11 — a leftover `import MaintenanceBlock from "@/components/MaintenanceBlock"` that isn't used (line 77 already notes "Maintenance removed — site is live").

No other file renders `<MaintenanceBlock />`.

## Changes
1. Delete `src/components/MaintenanceBlock.tsx`.
2. Remove the unused import line in `src/pages/CreateStory.tsx` (and the obsolete "Maintenance removed" comment).

## Not changed
- No routing changes.
- No DB changes (the `maintenance_signups` table stays — it's only referenced by the deleted component and holds historical signups).
- No other UI, styling, or behavior touched.

## Verification
- App still builds.
- `/library`, `/`, `/create` load directly with no banner (already the case today).
