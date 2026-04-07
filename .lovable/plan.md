

## Plan: Make Coloring Canvas Fill Entire Screen

### Problem
The bottom toolbar has excessive padding (`paddingBottom: max(120px, calc(env(safe-area-inset-bottom, 34px) + 90px))`) creating large white space below the color palette. The canvas sizing calculation also uses a fixed `toolbarHeight` that may not match the actual UI, leaving unused space.

### Single file changed: `src/components/story/OnlineColoringCanvas.tsx`

### Changes

**1. Reduce bottom toolbar padding (line 649)**
Replace the oversized `paddingBottom` with a reasonable safe-area-aware value:
```
paddingBottom: `calc(env(safe-area-inset-bottom, 8px) + 8px)`
```

**2. Update `resizeCanvases` to use more available space (lines 340-347)**
- Reduce the fixed `toolbarHeight` estimate from `44 + 110 = 154px` to a tighter value (~100px) that matches the actual reduced toolbar
- Let the canvas use `availH` fully on mobile (`canvasMaxH = availH`)

**3. Make canvas container stretch to fill (line 629)**
Add `min-h-0` to the flex-1 canvas area div so it properly shrinks within the flex column and the canvas fills all available space.

### What stays the same
- All drawing logic, tools, colors, save/print
- Top toolbar layout
- All other files untouched

