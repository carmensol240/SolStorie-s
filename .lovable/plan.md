

## Plan: Convert Eraser to Flood-Fill Erase

### Overview
Change the eraser from a brush-style tool (draws transparent circles along path) to a flood-fill erase tool — one click erases the entire contiguous colored region, exactly like the fill bucket but clearing instead of painting.

### Changes — single file: `src/components/story/OnlineColoringCanvas.tsx`

### 1. Add a `floodErase` function (after `floodFill`, ~line 200)
A new function similar to `floodFill` but instead of painting a color, it sets matching pixels to fully transparent (alpha = 0) on the draw layer. It works on the draw canvas only (not the background), finding the contiguous region of the same color at the click point and clearing it.

```ts
function floodErase(
  drawCtx: CanvasRenderingContext2D,
  startX: number, startY: number,
  w: number, h: number,
  tolerance = 32
) {
  const drawData = drawCtx.getImageData(0, 0, w, h);
  const dd = drawData.data;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

  const startIdx = (sy * w + sx) * 4;
  // If pixel is already transparent, nothing to erase
  if (dd[startIdx + 3] === 0) return;

  const targetColor = [dd[startIdx], dd[startIdx+1], dd[startIdx+2], dd[startIdx+3]];
  const visited = new Uint8Array(w * h);
  const queue = [sx, sy];
  visited[sy * w + sx] = 1;

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;
    const idx = (cy * w + cx) * 4;
    // Clear to transparent
    dd[idx] = dd[idx+1] = dd[idx+2] = dd[idx+3] = 0;

    for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]]) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nPos = ny * w + nx;
      if (visited[nPos]) continue;
      visited[nPos] = 1;
      const nIdx = nPos * 4;
      if (dd[nIdx+3] === 0) continue; // skip transparent
      if (colorsMatch(dd, nIdx, targetColor, tolerance)) {
        queue.push(nx, ny);
      }
    }
  }
  drawCtx.putImageData(drawData, 0, 0);
}
```

### 2. Replace eraser in `handlePointerDown` (lines 378-388)
Replace the `destination-out` arc drawing with a single `floodErase` call:
```ts
if (currentTool === 'eraser') {
  const drawCtx = canvasRef.current?.getContext('2d');
  if (!drawCtx || !canvasRef.current) return;
  floodErase(drawCtx, pos.x, pos.y, canvasRef.current.width, canvasRef.current.height);
  saveSnapshot();
  return;
}
```

### 3. Remove eraser from `handlePointerMove` (lines 413-436)
Change the condition on line 417 so eraser no longer triggers drag drawing:
```ts
if (currentTool !== 'brush') return;
```
And remove the eraser branch from the if/else block (lines 422-424).

### 4. Remove `setIsDrawing(true)` and `lastPos` from eraser path
Since eraser is now single-click only (no dragging), remove `setIsDrawing(true)` and `lastPos.current = pos` from the eraser block.

### What stays the same
- Fill tool, brush tool, all colors, layout, design
- `ERASER_SIZE` constant (no longer used for erasing but kept for cursor)
- No other files changed

