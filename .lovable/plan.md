## Goal
Show the SolStorie's™ logo (same gradient text as `GlobalFooter`) at the bottom-center of every page inside the story viewer, as a small, non-intrusive link that opens https://soulstory.co.il in a new tab.

## Change (single file)

`src/pages/StoryViewer.tsx` — add one absolutely-positioned overlay just above the existing bottom navigation arrows row (around line 1788, inside the same wrapper that hosts `MagicalBookFrame` and the bottom nav). This single element renders on every page type — combined, illustration-only, text, cover, end — without touching any per-page layout.

```tsx
{/* Branded footer link — shown on every story page */}
<a
  href="https://soulstory.co.il"
  target="_blank"
  rel="noopener noreferrer"
  className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40 opacity-60 hover:opacity-100 transition-opacity"
  aria-label="SolStorie's"
>
  <span className="text-[11px] font-black logo-3d-bubble">
    <span className="logo-rainbow">SolStorie's™</span>
  </span>
</a>
```

Placement notes:
- Sits above the bottom-nav arrows (which use `bottom-2`), so it doesn't overlap them.
- `pointer-events` left default so the link is clickable; it occupies a tiny strip centered horizontally and won't cover the small page-number indicator (which is `bottom-1`, left/right of the logo's narrow footprint).
- Uses the exact same `logo-3d-bubble` + `logo-rainbow` classes as `GlobalFooter`, just sized smaller.

No other files, styles, routes, or logic change.