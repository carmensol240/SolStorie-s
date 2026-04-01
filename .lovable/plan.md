

## Plan: Overlay Navigation Arrows on Story Image

### Summary
Move the navigation arrows from a separate bottom bar into the book frame, overlaying the story image. Reduce button size to 40px, make them semi-transparent, and let the book frame expand to fill the freed space.

### Changes — `src/pages/StoryViewer.tsx` only

#### 1. Move arrows inside the book frame (lines ~1821-1852)

Remove the bottom `<div>` containing the nav arrows and page indicator (lines 1824-1852). Instead, place the arrow buttons **inside** the `MagicalBookFrame` container (after line 1821, inside the relative `div` at line 1270), positioned absolutely on left/right sides of the image.

**Before** (lines 1824-1852):
```tsx
{/* Navigation Arrows - bottom corners */}
<div className="flex items-center justify-between px-4 py-2 shrink-0">
  <button ... className="nav-arrow-btn"> ... </button>
  <div className="dot-indicator"> ... </div>
  <button ... className="nav-arrow-btn"> ... </button>
</div>
```

**After** — arrows placed inside the `relative` container at line 1270, overlaying the book:
```tsx
{/* Overlay nav arrows */}
<button
  onClick={() => handlePageNav('next')}
  disabled={currentPage >= totalVirtualPages + 1 || isFlipping}
  className="absolute left-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
  aria-label="עמוד הבא"
>
  <ChevronLeft className="w-5 h-5" />
</button>

<button
  onClick={() => handlePageNav('prev')}
  disabled={currentPage <= -1 || isFlipping}
  className="absolute right-2 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center"
  aria-label="עמוד קודם"
>
  <ChevronRight className="w-5 h-5" />
</button>
```

The page indicator text will be removed (or optionally kept as a tiny overlay at the bottom center of the frame).

#### 2. Book frame expands to fill freed space

By removing the bottom nav bar `div` (which had `py-2 shrink-0`), the `flex-1 min-h-0` book frame will naturally expand to fill the available vertical space.

### Technical details
- Buttons: 40px (`w-10 h-10`), `bg-black/40` for semi-transparency, `backdrop-blur-sm`
- Position: `absolute left-2 / right-2 top-1/2 -translate-y-1/2 z-40`
- No other files modified

