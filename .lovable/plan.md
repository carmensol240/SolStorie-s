

## Plan: Replace Brush with Flood Fill Tool

### Overview
Replace the brush/painting tool with a flood-fill (paint bucket) tool as the default coloring mode. Users tap an area and the entire enclosed region fills with the selected color. Keep the eraser and color palette unchanged. Remove brush sizes (no longer needed).

### How Flood Fill Works
A standard queue-based flood fill algorithm on the drawing canvas:
1. Get the pixel color at the tap point
2. BFS/queue outward, replacing matching pixels with the selected color
3. Use a tolerance (~30) to handle anti-aliased edges from the background outlines
4. The fill operates on the drawing layer only, but reads from a **merged** view (bg + drawing) to detect boundaries from the background outlines

### Changes — `src/components/story/OnlineColoringCanvas.tsx`

1. **Remove**: `BRUSH_SIZES` constant, `brushSize` state, brush size buttons from toolbar, `buildBrushCursor` function, `ERASER_CURSOR`, brush drawing logic (`draw`, `startDrawing` with line strokes)

2. **Add**: `floodFill(ctx, bgCtx, x, y, fillColor, tolerance)` function that:
   - Reads pixel data from a merged snapshot (background + drawing layer) to detect outline boundaries
   - Writes fill pixels to the drawing canvas only
   - Uses a queue-based BFS with a color tolerance of ~30 for anti-aliased edges
   - Scales coordinates from CSS to canvas pixel space

3. **Update interaction handlers**:
   - `onMouseDown` / `onTouchStart`: If not eraser mode, call `floodFill` at tap position, then `saveSnapshot`
   - Remove `onMouseMove` / `onTouchMove` handlers for fill mode (no dragging needed)
   - Keep eraser mode with existing drag-to-erase behavior (simplified to a large round eraser)

4. **Update toolbar UI**:
   - Replace Pencil icon with a `PaintBucket` icon (from lucide-react) for the fill tool
   - Remove brush size selector buttons entirely
   - Keep eraser toggle and color palette unchanged
   - Cursor: use a paint bucket cursor SVG for fill mode

5. **Keep unchanged**: Undo/redo, save/download, print, color palette, eraser tool, canvas layering (bg + draw), `boldenOutlines`, aspect ratio logic

### Files modified
1. `src/components/story/OnlineColoringCanvas.tsx`

