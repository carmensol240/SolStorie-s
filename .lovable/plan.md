## Plan: Revert ChildInfoStep photo/avatar layout, fix only original photo fit

### Changes in `src/components/wizard/ChildInfoStep.tsx`

1. **Revert the vertical-stack block (lines ~750–827) back to the prior horizontal side-by-side layout:**
   - Outer wrapper: horizontal flex row — original photo (left) → arrow → avatar (right).
   - Original photo: `w-20 h-20` mobile → `md:w-32 md:h-32`.
   - Arrow: horizontal `ArrowLeft` icon in the animated gradient circle with sparkles.
   - Avatar: `w-64 h-64` → `md:w-72 md:h-72`, **`object-cover`** (fills container, no white margins).
   - Restore all previous labels, sparkle decorations, gradients, ring/shadow styling exactly as before.

2. **Single fix:** the original child photo `<img>` (alt `תמונה מקורית`) uses **`object-contain`** instead of `object-cover` so the full face is visible without cropping.

3. **Imports:** swap `ArrowDown` back to `ArrowLeft` in the `lucide-react` import (remove `ArrowDown` if unused elsewhere in the file).

4. Avatar size, classes, and everything else in the file stay untouched.

### Files touched
- `src/components/wizard/ChildInfoStep.tsx`
