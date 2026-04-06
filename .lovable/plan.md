

## Plan: Open OnlineColoringCanvas Directly from Library

### Problem
Clicking "צביעה" on a coloring page in the library navigates to the story viewer instead of opening the coloring canvas directly.

### Solution — single file: `src/pages/Library.tsx`

**1. Import `OnlineColoringCanvas`**
```ts
import { OnlineColoringCanvas } from "@/components/story/OnlineColoringCanvas";
```

**2. Add state for selected coloring page** (near other state declarations)
```ts
const [coloringCanvasImage, setColoringCanvasImage] = useState<string | null>(null);
const [coloringCanvasTitle, setColoringCanvasTitle] = useState<string>('');
```

**3. Replace the "צביעה" button click handler** (line 504)
Instead of `navigate(...)`, set state to open the canvas:
```ts
onClick={() => {
  const url = getPublicIllustrationUrl(cp.coloring_image_path);
  if (url) {
    setColoringCanvasImage(url);
    setColoringCanvasTitle(cp.story_topic || '');
  }
}}
```

**4. Render `OnlineColoringCanvas`** (at the end of the component JSX)
```tsx
<OnlineColoringCanvas
  isOpen={!!coloringCanvasImage}
  onClose={() => setColoringCanvasImage(null)}
  backgroundImage={coloringCanvasImage || ''}
  storyTitle={coloringCanvasTitle}
/>
```

### What stays the same
- Download button logic
- All story tab logic
- OnlineColoringCanvas component itself
- All other pages

