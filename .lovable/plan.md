

## Plan: Fix White Margins on Story Illustrations

### Root Cause
In `src/pages/StoryViewer.tsx`, `handleImageLoad` (lines 207-220) detects portrait images and switches them from `object-cover` to `object-contain`, adding `margin: auto` and `maxWidth/maxHeight`. This creates visible white margins on the sides.

Additionally, line 1267 uses `object-contain` for learning topic covers instead of `object-cover`.

### Changes — `src/pages/StoryViewer.tsx`

#### 1. Lines 207-220 — Remove portrait→object-contain swap

Replace the `handleImageLoad` callback so it no longer switches to `object-contain`. Keep `object-cover` for all images:

```typescript
const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
  // Keep object-cover for all images — no white margins
}, []);
```

#### 2. Line 1267 — Cover image for learning topics

Replace:
```typescript
(coverIsLandscape || isLearningTopic) ? "object-contain" : "object-cover"
```
With:
```typescript
"object-cover"
```

### No other files touched.

