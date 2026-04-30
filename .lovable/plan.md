## Goal

Eliminate the white flash visible when navigating between story pages in `StoryViewer`. Per the request: change ONLY the background color of the transition container to dark — no other changes.

## Root Cause

In `src/pages/StoryViewer.tsx` (line 1336), the page content lives in a div that fades to `opacity-0` for 300ms during navigation:

```tsx
<div className={cn(
  "relative w-full h-full overflow-hidden",
  "transition-opacity duration-300 ease-in-out",
  isFlipping ? "opacity-0" : "opacity-100",
)}>
```

When the content fades out, the parent `.dream-card` (in `src/components/story/book-frame/magical-book.css`, line 115) shows through with `background: rgba(255, 255, 255, 0.85)` — that's the white flash.

## Change

Single CSS edit in `src/components/story/book-frame/magical-book.css`, line 115 only:

```css
/* before */
background: rgba(255, 255, 255, 0.85);
/* after */
background: #1a0f3a;
```

Color `#1a0f3a` matches the existing dark night-purple used elsewhere in the reader (`RAINBOW_BG` in `StoryViewer.tsx`, BookFrame night-sky theme), so the backdrop revealed during the fade is dark and consistent — no white flash.

## Out of Scope

- No changes to navigation logic, transition type, durations, or any TSX file.
- No changes to other CSS rules (border, shadow, backdrop-filter, animations all stay).
- No refactoring.
