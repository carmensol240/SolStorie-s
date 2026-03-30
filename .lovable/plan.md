

## Plan: Dynamic Aspect Ratio for Portrait Illustrations

### Problem
Portrait illustrations show white/empty sidebars because the container is fixed fullscreen and `object-contain` leaves gaps.

### Approach
In `handleImageLoad`, when a portrait image is detected, find the parent container and adjust its styling so it matches the image's natural aspect ratio — eliminating side bars entirely.

### Changes — `src/pages/StoryViewer.tsx` only

**1. Update `handleImageLoad` (lines 207-214):**

When portrait detected:
- Remove `absolute inset-0` from the image (so it's not pinned to container edges)
- Add `object-contain w-full h-full` to the image
- Find the parent container (`img.parentElement`) and:
  - Remove `h-full` class
  - Add `flex items-center justify-center` for centering
  - Set `img.style.aspectRatio` to `${img.naturalWidth}/${img.naturalHeight}` so the image sizes itself naturally
  - Set `img.style.maxHeight = '100%'` and `img.style.maxWidth = '100%'` to keep it bounded

```typescript
const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.naturalHeight > img.naturalWidth) {
    img.classList.remove('object-cover', 'absolute', 'inset-0');
    img.classList.add('object-contain');
    img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    img.style.maxHeight = '100%';
    img.style.maxWidth = '100%';
    img.style.margin = 'auto';
    
    const container = img.closest('.animate-fade-in');
    if (container instanceof HTMLElement) {
      container.classList.add('flex', 'items-center', 'justify-center');
    }
  }
}, []);
```

**2. No changes to the `<img>` tags themselves** — they keep `absolute inset-0 w-full h-full object-cover` as defaults; `handleImageLoad` overrides dynamically for portrait images.

**3. No other files or logic touched.**

