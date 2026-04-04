

## Plan: Fix Online Coloring Page Mobile Layout

### Problem
On mobile (320px wide), the canvas is sized to fill the entire viewport (`window.innerWidth / window.innerHeight`), but the top bar and bottom toolbar overlay on top. The image gets centered vertically in the full screen, leaving dead space above it. The image may also get cropped due to cover-style scaling.

### Changes — single file: `src/components/story/OnlineColoringCanvas.tsx`

**1. Change canvas sizing to account for toolbars (lines 192-230)**

Instead of using `window.innerWidth / window.innerHeight` for canvas dimensions, calculate available height by subtracting the top bar (~44px) and bottom toolbar (~100px). This removes the white gap above the image.

```
const toolbarHeight = 44 + 100; // top bar + bottom bar
const availH = vh - toolbarHeight;
```

Use `contain` logic (already present) with `availH` instead of `vh` so the image fits fully without cropping.

**2. Change layout from absolute overlay to flex column (lines 388-484)**

Replace the current `absolute inset-0` canvas centering with a proper flex column layout:
- Top bar (fixed height)
- Canvas area (flex-1, centered)  
- Bottom toolbar (fixed height)

This ensures the image sits between the bars with no white gap above it, and tools always appear below.

**3. Keep `object-contain` behavior**

The `resizeCanvases` function already uses contain logic (fit within bounds). Just ensure the bounds exclude the toolbar heights.

### What stays the same
- All drawing/fill/eraser logic
- Undo/redo, save, print
- Color palette and tool selection
- Fullscreen API usage
- Desktop behavior (toolbars are small relative to screen)

