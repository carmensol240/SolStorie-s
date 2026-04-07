

## Plan: Add Landscape Rotation Toggle to Coloring Canvas

### Single file changed: `src/components/story/OnlineColoringCanvas.tsx`

### Changes

**1. Add landscape state and toggle function**
- Add `isLandscape` state (default `false`)
- Toggle function tries `screen.orientation.lock('landscape')` first; if unsupported/rejected, falls back to CSS transform approach
- On exit (close or toggle back), unlock orientation / remove transform

**2. Add rotate