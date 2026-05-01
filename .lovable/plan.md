## Problem

On the AuthStep screen (mobile, 320×543), the "המשיכו עם Google" button is not clickable.

## Root Cause

`AuthStep.tsx` wrapper uses `fixed inset-0 ... z-10`, but the parent `CreateStory.tsx` page renders two overlapping fixed elements at higher z-indexes:

- **Sticky header** (`CreateStory.tsx`): `sticky top-0 z-20` — overlays the top portion of the AuthStep card.
- **MobileNavigation** (`MobileNavigation.tsx`): `fixed bottom-0 ... z-[100]` — overlays the bottom portion.

Because the AuthStep card is vertically centered and the Google button sits near the top of the card, the sticky header (z-20) sits on top of it and intercepts taps — making the button visually visible but not clickable on small viewports.

This regressed when the AuthStep wrapper was changed from `min-h-screen` (in-flow) to `fixed inset-0 z-10` (overlay) in the previous "center vertically" fix.

## Fix

Single-line change in `src/components/wizard/AuthStep.tsx`:

- Raise the AuthStep wrapper z-index from `z-10` to `z-[110]` so the entire overlay (including the starry background) sits above both the sticky header (z-20) and the MobileNavigation (z-[100]).

This restores clickability of the Google button (and all other elements in the card) without changing layout, styling, form fields, or auth logic.

No other files are touched.
