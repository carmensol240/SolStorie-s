## Goal
Revert two unauthorized changes.

## Changes

### 1. `src/pages/DemoStory.tsx`
Restore to the previous hardcoded version:
- Re-import `DEMO_STORY` from `@/data/demo-story`.
- Remove `useEffect`, `useState` (for story/loading/error), `supabase` import, `Loader2`, `DEMO_SLUG`, RPC fetch logic, and loading/error UI states.
- Render pages directly from `DEMO_STORY.pages` as before, keeping only `currentPage` state for navigation.
- Header title returns to the previous static text.
- Keep RTL wrapper, header, back button, `BookFrame`/`BookPage`/`NavigationArrows`, and CTA button untouched.

### 2. `src/components/MobileNavigation.tsx`
Remove the login button addition:
- Remove `LogIn` from lucide-react imports.
- Remove `useAuth` import and the `const { user, loading } = useAuth()` call.
- Remove the conditional `{ path: "/auth", icon: LogIn, label: "התחברות" }` entry from `navItems`, restoring it to just Home / Library / Settings.

## Out of scope
No other files touched. No changes to auth flow, routing, or styles.
