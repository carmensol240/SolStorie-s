

## Plan: Redesign Text-Only Pages in Story Viewer

### What changes

Update the text-only page rendering (lines 1544-1594 in `StoryViewer.tsx`) to use a dark starry night style instead of themed gradient backgrounds with glassmorphism cards.

### Single file: `src/pages/StoryViewer.tsx`

**1. Simplify `getTopicTheme` (lines 91-142)**

All branches now return the same dark background, white text, and subtle white page number color. The emoji per topic is kept (it's used elsewhere too). Replace all `bg` values with `#0d0a1f`, all `textColor` with `#FFFFFF`, all `pageNumColor` with `rgba(255,255,255,0.3)`.

Actually — simpler: just override inside the text-only page block itself, ignoring theme colors for text pages.

**2. Update text-only page block (lines 1551-1592)**

- Background: solid `#0d0a1f` instead of `theme.bg`
- Add ~20-30 small scattered star dots using a CSS pseudo-element or inline random dots (generated once via `useMemo`)
- Remove the emoji icon div (lines 1570-1572)
- Remove the glassmorphism card styling from the text `<p>` (remove `backgroundColor`, `borderRadius`, `backdropFilter`, `padding` wrapper) — text sits directly on the dark background
- Text: white (`#FFFFFF`), keep existing font size, `lineHeight: '2'`
- Page number: `rgba(255,255,255,0.25)`, centered at bottom

**3. Add star dots**

Generate ~25 random positioned tiny dots (2-3px) with low opacity (0.3-0.7) as absolutely positioned `<span>` elements inside the page container via a `useMemo` that creates them once.

### What stays the same
- Illustration pages — untouched
- All story logic — untouched
- `getTopicTheme` still used for cover/closing pages with illustrations
- The `RAINBOW_BG` constant — still used elsewhere

