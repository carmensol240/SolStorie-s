

## Plan: Fix Rotated Cover Images in Library

### Problem
Cover images sometimes display rotated 90° due to EXIF orientation metadata not being handled by the browser.

### Changes

**3 files**, adding `imageOrientation: 'from-image'` style to all cover `<img>` tags:

1. **`src/components/ui/polaroid-card.tsx`** (line 36-42) — `CoverImage` component:
   - Add `style={{ imageOrientation: 'from-image' }}` to the `<img>` tag

2. **`src/components/ui/story-book-card.tsx`** (line 36-42) — `CoverImage` component:
   - Add `style={{ imageOrientation: 'from-image' }}` to the `<img>` tag

3. **`src/components/ui/signed-image.tsx`** (line 102-121) — `SignedImage` component:
   - Add `style={{ imageOrientation: 'from-image' }}` to the `<img>` tag (line 102)

All three `<img>` tags already have `object-cover` via className. The only addition is the inline `imageOrientation` style.

### What stays the same
All logic, layout, fallbacks, loading states — unchanged.

