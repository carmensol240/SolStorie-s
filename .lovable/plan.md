## Goal
Make the Disney avatar the clear visual hero on mobile by growing it to `w-64 h-64` (256 px) and shrinking the original photo to `w-20 h-20` (80 px) on the base/mobile breakpoint. Single file, two class changes only.

## Changes (`src/components/wizard/ChildInfoStep.tsx`)

1. **Original photo frame** (line ~758): bump mobile size to `w-20 h-20`.
   - `w-14 h-14 sm:w-28 sm:h-28 md:w-32 md:h-32` → `w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32`

2. **Avatar frame** (line ~798): grow mobile size to `w-64 h-64`.
   - `w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72` → `w-64 h-64 sm:w-64 sm:h-64 md:w-72 md:h-72`

## Out of scope
No padding, gap, arrow, pill, layout, copy, or logic changes.
