

## Plan: Reduce Eraser Size in Coloring Canvas

### Problem
The eraser (`ERASER_SIZE = 30`) creates a 60px diameter circle, which is far too large for precise erasing between lines in a coloring page. The line width during drag is `ERASER_SIZE * 2 = 60`, making it even worse.

### Fix — single file: `src/components/story/OnlineColoringCanvas.tsx`

**Line 37**: Reduce `ERASER_SIZE` from `30` to `10`
```ts
const ERASER_SIZE = 10;
```

This changes:
- Pointer down: erases a circle of radius 10 (20px diameter) instead of 60px
- Pointer move: line width becomes 20 instead of 60

The cursor SVG circle will also visually match since it's separate, but the erasing area will be much more precise and suitable for coloring between lines.

### What stays the same
- All other tools, colors, layout, design
- No other files changed

