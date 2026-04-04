

## Plan: Fix Mobile Illustration White Space

### Problem
`object-contain` prevents cropping but creates visible white/empty bars above and below the illustration on mobile when the image aspect ratio doesn't match the container.

### Solution
Change mobile illustrations back to `object-cover` (fills the entire area) but **without** the `scale(1.02)` transform that was causing the original cropping complaint. This gives full coverage with minimal cropping — just natural edge fitting.

### Changes — single file: `src/pages/StoryViewer.tsx`

**Line 1813** (combined page img):
```
object-contain md:object-cover  →  object-cover
```

**Line 1925** (illustration page img):
```
object-contain md:object-cover  →  object-cover
```

The `style={{ transform: isMobile ? undefined : 'scale(1.02)' }}` stays as-is — mobile still gets no scale, desktop keeps the slight zoom.

### Result
- Mobile: illustration fills the entire frame, no white bars, no artificial scale
- Desktop: unchanged (object-cover + scale 1.02)
- Nothing else modified

