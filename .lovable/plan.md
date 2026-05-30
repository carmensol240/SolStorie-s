Dedupe the coloring palette and stop the bottom palette bar from covering the coloring image, in `src/components/story/OnlineColoringCanvas.tsx`. No other files / no behavior changes.

## 1. Dedupe colors

Current palette has both exact duplicates and near-duplicate shades across three arrays:

- Exact duplicates: `#C0C0C0` (in `COLORS` + `SKIN_EARTH_COLORS`), `#FFB6C1` (in `EXTRA_COLORS` + `SKIN_EARTH_COLORS`).
- Near duplicates: multiple cyans/light blues (`#48DBFB`, `#0ABDE3`, `#00BFFF`, `#87CEEB`), multiple dark navies (`#1B2A4A`, `#00008B`, `#000080`, `#2C3E50`), multiple lime greens (`#A3CB38`, `#BFFF00`, `#7CFC00`), multiple light purples (`#C4B5E0`, `#9370DB`), multiple brown/golds in earth row (`#D4AF37`/`#DAA520`/`#FFD700`, `#8B4513`/`#A0522D`/`#5C3317`).

Replace the three constants with deduplicated lists, one representative shade per hue family. Keep three rows so existing JSX/styles stay unchanged:

```ts
const SKIN_EARTH_COLORS = [
  '#000000', '#FFDBAC', '#F1C27D', '#E0AC69',
  '#C68642', '#8D5524', '#5C3317', '#A0522D',
  '#DAA520', '#808000', '#228B22', '#6B8F71',
];

const COLORS = [
  '#FF6B6B', '#EE5A24', '#FF9F43', '#FECA57',
  '#A3CB38', '#1DD1A1', '#48DBFB', '#0ABDE3',
  '#5F27CD', '#FF6FF2', '#C0C0C0', '#2C3E50',
];

const EXTRA_COLORS = [
  '#87CEEB', '#000080', '#9370DB', '#8A2BE2',
  '#FFB6C1',
];
```

Result: 29 unique swatches across three rows (was ~40 with overlaps), no two shades within ΔE-perceptual-near range. Each row stays ≤12 swatches so it fits on one row on desktop and at most two rows on mobile.

## 2. Stop the palette from covering the page

Root cause: the outer container uses absolute-positioned overlays — canvas area is `absolute inset-0` and the bottom bar is `absolute bottom-0` on top of it. The canvas sizing reads `canvasAreaRef.clientHeight`, which is the full viewport, so the drawing extends behind the semi-transparent bottom bar. The in-file comment (line 366) and the project memory (`Coloring Canvas UI — 100dvh flex-col`) both state the intended layout is a flex column where bars take natural height and the canvas takes the remainder.

Switch the layout in `OnlineColoringCanvas.tsx` JSX only (no logic changes):

- Outer wrapper (line 631): add `flex flex-col` to the className. Keep `height: '100dvh'` and the landscape-rotate fallback inline styles untouched.
- Top bar (line 646): replace `absolute top-0 left-0 right-0 z-20` with `relative z-20 shrink-0`.
- Canvas area (line 695): replace `absolute inset-0 z-0 w-full h-full` with `relative z-0 flex-1 min-h-0 w-full`.
- Bottom bar (line 715): replace `absolute bottom-0 left-0 right-0 z-20` with `relative z-20 shrink-0`.

The existing `ResizeObserver` already re-runs `resizeCanvases` when the bottom bar height changes (rows wrap on narrow widths), so the canvas will continue to fit-contain itself correctly on mobile / tablet / desktop with no overlap.

## Out of scope

Tools, brush sizes, fill/erase logic, top bar contents, landscape rotation, save/print/share flow, and entitlement checks all remain untouched.
