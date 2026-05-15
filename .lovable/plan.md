## Plan: Enlarge "תמונה מקורית" thumbnail to w-32 h-32

In `src/components/wizard/ChildInfoStep.tsx`, the original photo thumbnail in the horizontal layout (line ~754) currently uses `w-20 h-20 md:w-32 md:h-32`. On the 390px mobile viewport this renders at the small `w-20 h-20`.

### Change
- Update the thumbnail wrapper to **`w-32 h-32`** at all breakpoints (drop the `md:` variant).
- Keep `object-contain` on the `<img>` (already set).
- Avatar, layout, arrow, labels, and everything else unchanged.

### Files touched
- `src/components/wizard/ChildInfoStep.tsx`
