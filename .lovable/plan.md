## Problem

In `src/components/story/OnlineColoringCanvas.tsx`, the canvas size is computed by reserving a fixed `toolbarHeight` from the viewport height:

```ts
const toolbarHeight = isMobile ? 110 : 200;
```

On desktop the actual chrome is taller than 200px:
- Top bar (~45px)
- Bottom toolbar: vertical padding + tools row (~36px) + skin/earth row (`md:h-11` = 44px) + colors row (44px) + `space-y-1.5` gaps + safe-area bottom padding ≈ ~165–180px

Total ≈ 210–230px, so the canvas pushes the bottom toolbar past `100dvh` and the **last row of color swatches gets clipped** on desktop.

## Fix (single file, presentation only)

Edit only `src/components/story/OnlineColoringCanvas.tsx`:

1. In `resizeCanvases`, raise the desktop reserve so both color rows always fit:
   ```ts
   const toolbarHeight = isMobile ? 110 : 240;
   ```
2. As a belt-and-braces guard, ensure the bottom toolbar never gets squeezed/hidden — keep `flex-shrink-0` (already set) and confirm the outer container's `overflow-hidden` plus `flex-1 min-h-0` canvas area still let the toolbar render fully (no other change needed).

That's it — palette will display in full on every screen size including desktop.

## Out of scope

- No changes to colors, tools, layout structure, mobile behavior, business logic, or any other file.
