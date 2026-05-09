## Goal
Make "התחברות" reachable from every screen that shows the persistent bottom navigation, not just from the Settings tab — so returning, signed-out users can log in at any time.

## File
`src/components/MobileNavigation.tsx` only.

## Change
1. Import `useAuth` from `@/hooks/use-auth` and `LogIn` from `lucide-react`.
2. Read `{ user, loading }` from `useAuth()`.
3. When `!loading && !user`, prepend an extra nav item to `navItems`:
   - `path: "/auth"`
   - `icon: LogIn`
   - `label: "התחברות"`
4. Keep the existing three items (Home / Library / Settings) and all current styling, active-state logic, accessibility attrs, and layout untouched. The new item uses the exact same className pattern.

## Result
- Signed-out users: bottom bar shows 4 items — **התחברות · בית · ספרייה · הגדרות**, available on every screen that already renders `MobileNavigation`.
- Signed-in users: bottom bar is unchanged (3 items).
- The existing Settings logged-out login card remains as a secondary entry point.

## Out of scope
- `src/pages/Settings.tsx`, `App.tsx`, `/auth` page, any other header/nav.
- No new routes; `/auth` is already wired in `App.tsx`.
- No logic, styling, or copy changes anywhere else.
