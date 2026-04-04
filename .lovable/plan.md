

## Plan: Revert Illustration Display to Original Settings

### Problem
The recent responsive changes (`object-contain md:object-cover`) cause white bars above and below illustrations on mobile. The user wants the original full-frame look back.

### Changes — single file: `src/pages/StoryViewer.tsx`

**Line 1813** (combined page img) and **Line 1925** (illustration page img):
- Change `object-contain md:object-cover` back to `object-cover`
- Change `style={{ transform: isMobile ? undefined : 'scale(1.02)' }}` back to `style={{ transform: 'scale(1.02)' }}`

### Result
- All illustrations fill the entire frame on both mobile and desktop — no white bars
- Original behavior fully restored

