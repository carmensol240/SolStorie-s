

## Plan: Redesign Online Coloring Canvas — Kids Coloring App

### Overview
Redesign `OnlineColoringCanvas.tsx` to feel like a professional, fun kids coloring app with undo/redo, custom paintbrush cursor, larger color circles, and a kid-friendly layout.

### Changes — `src/components/story/OnlineColoringCanvas.tsx`

**1. Undo/Redo system**
- Store drawing history as an array of `ImageData` snapshots
- Save a snapshot after each stroke ends (`stopDrawing`)
- `historyIndex` tracks current position; undo/redo navigate the array
- Top bar buttons: Undo (↩️), Redo (↪️), Save (💾), Print (🖨️), Close (✕)

**2. Custom paintbrush cursor**
- Use CSS `cursor: url(...)` with an inline SVG data URL of a paintbrush icon (colored to match current brush color)
- Switch to a circle cursor for eraser mode
- Fallback to `crosshair`

**3. Top bar redesign**
- Fun gradient background (purple-to-pink, matching app theme)
- White icon buttons: Undo, Redo, divider, Save, Print, divider, Close
- Compact, minimal text — icons speak for themselves

**4. Color palette redesign (bottom)**
- 12 large round circles (`w-11 h-11` / 44px) with thick white border
- Selected color gets a colored ring + subtle scale-up
- Arranged in a single scrollable row, easy to tap on mobile
- Add a few more kid-friendly colors (brown, black, white-with-border)

**5. Brush size selector**
- 3 sizes: Small (6px), Medium (14px), Large (24px) — bigger than current for kid-friendly strokes
- Show as circles of increasing size inside rounded buttons
- Placed above the color row

**6. Tools row**
- Paintbrush button (shows current color), Eraser button
- Active tool gets a colored highlight ring

**7. Canvas area**
- Background changed to a subtle checkerboard or soft pastel to feel fun
- Canvas fills maximum available space (already does, but ensure padding is minimal)

**8. Background image processing**
- After drawing the coloring page onto bgCanvas, apply a contrast boost to make outlines thicker/bolder: iterate pixels and darken dark areas (threshold filter to strengthen line art)

### Layout structure
```text
┌─────────────────────────────────┐
│  ↩️  ↪️  │  💾  🖨️  │  ✕ חזרה  │  ← gradient purple top bar
├─────────────────────────────────┤
│                                 │
│       [ Coloring Canvas ]       │  ← fills most of screen
│                                 │
├─────────────────────────────────┤
│  🖌️ brush  🧹 eraser  │ S M L  │  ← tools row
│  ⚫🔴🟠🟡🟢🔵🟣🩷⬜🤎          │  ← large color circles
└─────────────────────────────────┘
```

### Files modified
1. `src/components/story/OnlineColoringCanvas.tsx` — full redesign with undo/redo, custom cursor, kid-friendly UI

