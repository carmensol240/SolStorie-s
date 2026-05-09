## Goal
In `src/components/wizard/ChildInfoStep.tsx`, make the Disney-style avatar the visual "hero" of the photo upload section after a child photo is uploaded, and fix the cramped upload box on tablet. Frontend-only, no logic changes.

## Changes (single file: `src/components/wizard/ChildInfoStep.tsx`)

### 1. Avatar becomes the hero (after-upload state, lines ~754–828)

Currently the original photo and the avatar are both rendered as equal `w-32 h-32` square frames side-by-side. Update the side-by-side layout so the avatar visually dominates:

- **Avatar frame** (currently `w-32 h-32`): grow to about `w-44 h-44` on mobile and `sm:w-64 sm:h-64 md:w-72 md:h-72` on tablet. Keep rounded corners, add a slightly stronger ring (`ring-4 ring-amber-300/80`) and a larger shadow (`shadow-2xl`) to emphasize the wow moment. Bump the avatar's "דמות בסיפור" pill to `text-xs` and add a subtle glow.
- **Original photo frame** (currently `w-32 h-32`): shrink to about `w-20 h-20` on mobile and `sm:w-28 sm:h-28 md:w-32 md:h-32` on tablet. Keep its current ring/shadow but tone down (`shadow-md`, `ring-1`). Pill stays `text-[10px]`.
- **Arrow**: keep current size on mobile, scale up slightly on tablet (`sm:w-11 sm:h-11`) so it stays proportional between the two frames.
- **Layout**: keep the current `flex items-center justify-center gap-2 sm:gap-4 md:gap-6`. Switch alignment from `items-start` to `items-center` so the smaller original photo sits centered relative to the larger avatar.
- **Loader inside avatar**: bump the spinner from `w-8 h-8` to `w-12 h-12` so it matches the larger frame.

### 2. Tablet height for empty upload box (lines ~934–957)

The `<label htmlFor="photo-upload">` upload dropzone uses `p-4 gap-2.5` and has no min-height, so on tablet (where the wizard column is wider) it looks short with empty space below. Update the label classes:

- Add `min-h-[140px] sm:min-h-[260px] md:min-h-[320px]` so the dropzone grows on tablet/desktop.
- Bump padding on larger screens: `p-4 sm:p-8` and `gap-2.5 sm:gap-5`.
- Bump the camera icon and label on tablet: `Camera` becomes `w-6 h-6 sm:w-10 sm:h-10`, the "העלו תמונה" text becomes `text-sm sm:text-lg`.
- Tips grid: keep two columns but bump font on tablet `text-[10px] sm:text-sm` and gap `gap-y-1.5 sm:gap-y-2.5`.

Also slightly increase tablet padding on the after-upload container (line 751) from `py-4` to `py-4 sm:py-6` for visual balance — no other styling changes there.

## Out of scope

- No changes to upload logic, validation, avatar generation, state, or any other step.
- No changes to mobile copy, RTL direction, button row, or photo validation grid.
- No changes outside `src/components/wizard/ChildInfoStep.tsx`.
