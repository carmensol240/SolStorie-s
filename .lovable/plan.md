

## Plan: Fix Image Rotation

### Problem
The `SignedImage` component uses `imageOrientation: 'from-image'` (line 106), which tells the browser to apply EXIF orientation metadata. AI-generated images sometimes contain incorrect EXIF rotation data, causing illustrations to display sideways.

### Fix
Change `imageOrientation` from `'from-image'` to `'none'` in `src/components/ui/signed-image.tsx`. This forces all images to display at 0 degrees regardless of EXIF metadata.

### Files modified
1. `src/components/ui/signed-image.tsx` — line 106: change `'from-image'` to `'none'`

