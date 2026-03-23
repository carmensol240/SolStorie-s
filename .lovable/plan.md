

## Plan: Dynamic Time-Based Theme

### What changes

Add automatic dark/light mode switching based on the user's local time. 18:00–06:00 = dark mode, 06:00–18:00 = light mode.

### Changes

**1. New hook: `src/hooks/use-time-theme.ts`**
- Reads `new Date().getHours()` on mount
- If hour >= 18 or hour < 6 → add `dark` class to `document.documentElement`
- Otherwise → remove `dark` class
- Sets up a `setInterval` (every 60s) to re-check in case the app stays open across the transition time
- Cleanup interval on unmount

**2. `src/App.tsx`** — Call `useTimeTheme()` at the top of the `App` component (one line addition)

**3. `src/index.css`** — Update the `.dark` block's `--background` to use `#0d0a1f` (HSL `240 47% 8%`) instead of the current `25 15% 10%`, matching the requested dark color

### What stays the same
- No manual toggle button
- All existing component styling using `dark:` Tailwind variants will work automatically
- Story viewer, navigation, cards — all inherit from CSS variables

