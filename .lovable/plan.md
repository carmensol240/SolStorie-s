

## Plan: Fix White Margins on Story Illustrations

### Changes — `src/pages/StoryViewer.tsx` only

#### 1. Lines 207-222 — Gut `handleImageLoad`

Replace with a no-op callback that keeps `object-cover` for all images:

```typescript
const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
  // Keep object-cover for all images — no white margins
}, []);
```

#### 2. Line 1267 — Cover image class

Replace:
```typescript
(coverIsLandscape || isLearningTopic) ? "object-contain" : "object-cover"
```
With:
```typescript
"object-cover"
```

No other files or code touched.

