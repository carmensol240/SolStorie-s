

## Plan: Use `object-contain` for Portrait Illustrations

### Problem
Story illustrations always use `object-cover`, which crops portrait (taller-than-wide) images on mobile. The full image should be visible.

### Approach
Add an `onLoad` handler to each illustration `<img>` that checks `naturalWidth` vs `naturalHeight`. If portrait, switch to `object-contain` with a dark background. Track portrait status in a state map keyed by URL.

### Changes — `src/pages/StoryViewer.tsx` only

**1. Add state** near other useState declarations:
```typescript
const [portraitImages, setPortraitImages] = useState<Record<string, boolean>>({});
```

**2. Add helper function:**
```typescript
const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.naturalHeight > img.naturalWidth) {
    setPortraitImages(prev => ({ ...prev, [img.src]: true }));
  }
};
```

**3. Update 3 illustration `<img>` tags** (lines ~1544, ~1619, and cover ~1238):

- **Combined page (line 1544)** and **Illustration-only page (line 1619)**: Change className from hardcoded `object-cover` to dynamic:
  ```
  className={`absolute inset-0 w-full h-full ${portraitImages[src] ? 'object-contain bg-black/90' : 'object-cover'}`}
  ```
  Add `onLoad={handleImageLoad}` to each.

- **Cover image (line 1238)**: Already has landscape detection logic — leave as-is (it handles this case).

No other files or logic touched.

