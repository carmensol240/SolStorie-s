

## Plan: Add Brush/Pencil Tool Alongside Flood Fill

### Overview
Add a freehand brush/pencil drawing tool as a third tool option alongside the existing flood fill and eraser. Users can switch between fill, brush, and eraser modes via the bottom toolbar.

### Changes — `src/components/story/OnlineColoringCanvas.tsx`

1. **New state**: Add `tool` state with values `'fill' | 'brush' | 'eraser'` replacing the boolean `isEraser`. Add `brushSize` state (default 6).

2. **New import**: Add `Pencil` from `lucide-react`.

3. **New cursor**: Add a `BRUSH_CURSOR` — a small circle SVG cursor colored with the current color.

4. **Update `handlePointerDown`**:
   - If `tool === 'fill'`: run `floodFill` + `saveSnapshot` (existing behavior)
   - If `tool === 'brush'`: begin drawing — set `isDrawing`, record `lastPos`, draw initial dot with `source-over` composite op using current color and `brushSize`
   - If `tool === 'eraser'`: existing eraser behavior

5. **Update `handlePointerMove`**:
   - If `tool === 'brush'` and `isDrawing`: draw line from `lastPos` to current position using `source-over`, current color, round lineCap, `brushSize` width
   - If `tool === 'eraser'` and `isDrawing`: existing eraser drag behavior

6. **Update `cursorStyle`**: Return appropriate cursor based on `tool` value.

7. **Update toolbar UI**: Show three tool buttons in a row:
   - `PaintBucket` icon for fill mode
   - `Pencil` icon for brush mode (colored with current color)
   - `Eraser` icon for eraser mode
   - Add a small brush size selector (3 preset sizes: S/M/L) shown only when brush tool is active

8. **Color selection**: Clicking a color auto-switches to fill mode (existing behavior stays).

### Files modified
1. `src/components/story/OnlineColoringCanvas.tsx`

