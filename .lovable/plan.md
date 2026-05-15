## Plan: Restyle photo + avatar display to vertical stacking

### What changes
In `src/components/wizard/ChildInfoStep.tsx`, update the side-by-side photo/avatar layout that appears after a child photo is uploaded (the block starting at line 752, rendered when `(formData.childAvatarUrl || isGeneratingAvatar) && formData.childPhoto` is true).

### Current layout
- Horizontal flex row: original photo → arrow → avatar
- Photo: `w-20 h-20` (mobile) up to `md:w-32 md:h-32`, `object-cover`
- Avatar: `w-64 h-64` up to `md:w-72 md:h-72`, `object-cover`
- Arrow: horizontal `ArrowLeft` icon in animated circle

### Target layout
- Vertical flex column (`flex-col`), centered (`items-center`)
- **Avatar (top)**
  - `w-56 h-56`, `object-contain`, centered
  - Label: `דמות בסיפור` stays below it
- **Arrow**
  - Pointing downward (swap `ArrowLeft` for `ArrowDown`)
  - Same gradient circle + sparkle decorations kept
- **Original photo (bottom)**
  - `w-24 h-24`, `object-contain`, centered
  - Label: `תמונה מקורית` stays below it
- Keep the same outer wrapper, dashed border, gradient background, and sparkles.
- Everything else in the component remains unchanged.

### Files touched
- `src/components/wizard/ChildInfoStep.tsx` — layout + import `ArrowDown` from `lucide-react`