

## Plan: Add Navigation Arrows to Online Coloring Canvas

### Overview
Add left/right arrow buttons inside the `OnlineColoringCanvas` so users can navigate between coloring pages without returning to the gallery.

### Changes

#### 1. `src/components/story/OnlineColoringCanvas.tsx` — Add optional navigation props

Add new optional props to the component interface:
```ts
onNavigatePrev?: () => void;
onNavigateNext?: () => void;
canGoPrev?: boolean;
canGoNext?: boolean;
```

At the bottom of the component JSX (inside the root container, after the canvas area), render two fixed-position circular arrow buttons:

- **Left arrow (next)**: fixed, left side, vertically centered, 72×72px circle, `#7C5CBF` background, white `❯` chevron. Hidden when `canGoNext` is false.
- **Right arrow (prev)**: fixed, right side, vertically centered, 72×72px circle, `#7C5CBF` background, white `❮` chevron. Hidden when `canGoPrev` is false.

Buttons use `z-50` to sit above the canvas. Inline styles for the exact size/color spec.

#### 2. `src/pages/Library.tsx` — Track current index and pass navigation callbacks

Add state:
```ts
const [coloringCanvasIndex, setColoringCanvasIndex] = useState<number>(-1);
```

Update the "צביעה" button click handler (~line 507) to also store the index of the clicked coloring page.

Add two handler functions:
- `handleColoringPrev`: if index > 0, set index - 1 and update `coloringCanvasImage` + `coloringCanvasTitle` from `coloringPages[index - 1]`
- `handleColoringNext`: if index < coloringPages.length - 1, set index + 1 and update similarly

Pass to `OnlineColoringCanvas`:
```tsx
<OnlineColoringCanvas
  isOpen={!!coloringCanvasImage}
  onClose={() => { setColoringCanvasImage(null); setColoringCanvasIndex(-1); }}
  backgroundImage={coloringCanvasImage || ''}
  storyTitle={coloringCanvasTitle}
  onNavigatePrev={handleColoringPrev}
  onNavigateNext={handleColoringNext}
  canGoPrev={coloringCanvasIndex > 0}
  canGoNext={coloringCanvasIndex < coloringPages.length - 1}
/>
```

### What stays the same
- All existing design, colors, layout, cards, buttons, navigation
- OnlineColoringCanvas drawing tools, colors, undo/redo, clear functionality
- StoryViewer coloring page opening (no arrows there — only from library gallery)

