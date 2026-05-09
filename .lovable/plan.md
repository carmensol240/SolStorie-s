## Goal
Give returning, signed-out users a clearly visible way to log in from anywhere in the app, using the existing `/auth` flow.

## Where it goes
The bottom `MobileNavigation` (Home / Library / Settings) is shown on every main screen. Tapping **Settings** while signed out already lands on a dedicated "צריך להתחבר" card (`src/pages/Settings.tsx`, lines 64–96), but its only CTA today is "צרו סיפור ראשון ✨", which sends users into the create flow rather than letting a returning user just log in.

This is the natural, low-risk spot for a login entry point: it's reachable from the persistent nav, and it's the screen a returning user will instinctively open. No new nav item is added (keeps the 3-item bottom bar clean).

## Change
**File:** `src/pages/Settings.tsx` — logged-out branch only (the `if (!authLoading && !user)` block).

Add a primary **`התחברות`** button to the card that navigates to `/auth` (the existing login route, already wired in `App.tsx`). Place it above the existing "צרו סיפור ראשון ✨" button so login is the primary action for returning users, and keep the create-story button as a secondary action (e.g. `variant="outline"`) so first-time users still have their path.

The button uses the existing `LogIn` icon (already imported) and the same gradient styling as the current primary button, so it matches the surrounding design system.

## Out of scope
- `MobileNavigation.tsx` (no new nav item)
- The `/auth` page itself
- Any authenticated UI, routing, or other pages

## Files to edit
- `src/pages/Settings.tsx` (logged-out card only)
