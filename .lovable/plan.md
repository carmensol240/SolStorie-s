

## Plan: Fullscreen Coloring Canvas

### Overview
Make the coloring canvas use 100% of screen space. The toolbar overlays on top of the canvas instead of taking vertical space from it. This maximizes the drawing area on all devices.

### Changes — `src/components/story/OnlineColoringCanvas.tsx`

1. **Canvas container**: Change from `flex-1` (shares space with top bar and bottom toolbar) to `absolute inset-0` filling the entire screen. The canvas `resizeCanvases` will use `window.innerWidth` / `window.innerHeight` directly instead of the container's reduced bounding rect.

2. **Top bar**: Make it `absolute top-0` with a semi-transparent background, overlaying the canvas. Reduce padding for mobile.

3. **Bottom toolbar**: Make it `absolute bottom-0` with a semi-transparent/translucent background (`bg-white/90 backdrop-blur-sm`), overlaying the canvas. Reduce vertical padding and make color buttons smaller on mobile (`w-9 h-9` instead of `w-11 h-11`).

4. **Remove `bg-black/50`** backdrop from the outer container since we want full white canvas behind.

5. **Remove `rounded-lg shadow-lg`** from canvases — no need for rounded corners in fullscreen.

6. **Hide browser chrome**: Add a `useEffect` that requests fullscreen API on open (if available) and exits on close, for maximum screen real estate on mobile.

### Files modified
1. `src/components/story/OnlineColoringCanvas.tsx`

