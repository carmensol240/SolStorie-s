# Demo story: visible arrows + swipe navigation

## Goal
Make page navigation obvious and gesture-friendly on `/demo-story` without touching anything else.

## Why current arrows aren't seen
The shared `NavigationArrows` component is rendered, but it uses a dark `bg-purple-900/50` styling tuned for the night-sky `BookFrame` background. On the demo page's amber/cream background (and at `right-2 / left-2` on mobile) it visually sinks into the page, and at page 0 the prev arrow is `disabled:opacity-20`. Net effect: feels like there are no arrows.

## Change (DemoStory only — `src/pages/DemoStory.tsx`)

1. Replace the shared `NavigationArrows` with two locally-styled, high-contrast circular buttons sized for the demo theme:
   - Prev on the right (RTL), Next on the left.
   - Always rendered, just hidden via `disabled` + `opacity-40 pointer-events-none` at edges.
   - Solid amber/orange gradient with white chevrons + drop shadow so they pop on both the cream background and the illustration.
   - `min-w-[44px] min-h-[44px]` for touch targets; arrows positioned at `right-2 / left-2` on mobile and `right-4 / left-4` on desktop, vertically centered on the book.
   - `aria-label` "עמוד הבא" / "עמוד קודם".
2. Add swipe support using existing `useSwipe` hook from `src/hooks/use-swipe.ts`:
   - `onSwipeLeft` → `goNext` (RTL: swiping the page leftward advances).
   - `onSwipeRight` → `goPrev`.
   - Threshold 50, attach handlers to the BookFrame wrapper div.
3. Keep keyboard nav out of scope (not asked).
4. No changes to fetch logic, RPC, header, CTA, types, or other files.

## Out of scope
- `PublicStoryViewer`, shared `NavigationArrows`, `BookFrame` styling.
- Removing the temporary `console.log` debug lines.
- Any visual overhaul beyond what's needed to make the arrows clearly visible.
