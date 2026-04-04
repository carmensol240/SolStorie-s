

## Plan: Increase Bottom Padding on Coloring Page Toolbar

### Problem
The bottom color row is still cut off on iPhone — the current `max(80px, ...)` padding isn't enough.

### Solution — single file: `src/components/story/OnlineColoringCanvas.tsx`

**Line 533**: Increase the padding from `max(80px, calc(env(safe-area-inset-bottom, 34px) + 50px))` to `max(120px, calc(env(safe-area-inset-bottom, 34px) + 90px))`.

### What stays the same
- Everything else — drawing logic, canvas sizing, tools, colors, desktop behavior

