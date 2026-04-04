

## Plan: Fix Online Coloring Page — Color Selection + Mobile Display

### Problem 1: Color not changing
The `handlePointerMove` callback sets `ctx.strokeStyle = color` but doesn't reset `ctx.globalCompositeOperation` to `source-over` before drawing. After using the eraser (which sets `destination-out`), switching back to brush and changing color may still use the stale composite operation from a previous eraser interaction. Additionally, the color buttons need explicit touch handling to ensure they register on mobile.

### Problem 2: Page cropped on mobile  
`h-screen` uses `100vh` which on mobile browsers includes the area behind the address bar. The bottom toolbar (colors/tools) gets pushed off-screen. Need to use `100dvh` (dynamic viewport height) which accounts for browser chrome.

### Changes — single file: `src/components/story/OnlineColoringCanvas.tsx`

**Fix 1 — Color application:**
- In `handlePointerMove`, explicitly set `ctx.globalCompositeOperation = 'source-over'` before brush strokes (not just in `handlePointerDown`)
- Ensure `ctx.strokeStyle = color` is always applied fresh each move

**Fix 2 — Mobile viewport:**
- Change the root container from `h-screen` to `h-dvh` (Tailwind's dynamic viewport height)
- Add fallback: `style={{ height: '100dvh' }}` for browsers that support dvh
- This ensures the full UI (canvas + toolbars) fits within the visible viewport on mobile without being cropped by browser chrome

### What stays the same
- All drawing, fill, eraser logic
- Undo/redo, save, print
- Color palette design and sticker functionality  
- Desktop behavior
- Canvas sizing calculations

