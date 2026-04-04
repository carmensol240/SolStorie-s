

## Plan: Fix iPhone Coloring Page — Toolbar Hidden Behind Browser Chrome

### Problem
From the screenshot: on iPhone Safari, the bottom toolbar (tools + color palette) is mostly hidden behind the browser's bottom navigation bar. The current `paddingBottom: max(6px, env(safe-area-inset-bottom, 6px))` is not enough — `env(safe-area-inset-bottom)` only accounts for the notch/home indicator (~34px), but the Safari toolbar adds ~44px more that `100dvh` doesn't exclude.

### Solution — single file: `src/components/story/OnlineColoringCanvas.tsx`

**Two changes:**

1. **Root container (line 487)**: Reduce the overall height to leave room for the browser chrome. Change from `height: '100dvh'` to `height: 'calc(100dvh - 60px)'` on mobile, or use a simpler approach: add `pb-16` (64px) to the root container so the bottom toolbar is pushed up above the browser bar.

   Better approach: keep `100dvh` but add a generous `paddingBottom` to the bottom toolbar so all content is visible:

2. **Bottom toolbar (line 533)**: Increase the safe-area padding from `max(6px, env(safe-area-inset-bottom, 6px))` to `max(80px, calc(env(safe-area-inset-bottom, 34px) + 50px))`. This ensures that even when Safari's bottom bar overlaps, the full color palette and tools remain visible.

### What stays the same
- All drawing/fill/eraser logic
- Canvas sizing and auto-trim
- Desktop behavior (the extra padding is harmless on desktop since `env(safe-area-inset-bottom)` is 0)
- Undo/redo, save, print
- Everything else

