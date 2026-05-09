## Goal
Make the Disney avatar visually dominate the original photo on mobile too. Currently mobile uses `w-20` original vs `w-44` avatar inside a `p-3` container with `gap-2` — at 320px viewport the row is nearly maxed out, so the size difference doesn't read as dramatic. Frontend-only, single file.

## Changes (`src/components/wizard/ChildInfoStep.tsx`, side-by-side block ~lines 754–828)

1. **Outer side-by-side container** (line 754): reduce mobile inner padding so we can fit a larger avatar without overflow at 320px.
   - `p-3` → `p-2 sm:p-3`

2. **Row gap** (line 755): tighten on mobile.
   - `gap-2 sm:gap-4 md:gap-6` → `gap-1.5 sm:gap-4 md:gap-6`

3. **Original photo frame** (line 758): shrink on mobile so the avatar is unambiguously the hero.
   - `w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32` → `w-14 h-14 sm:w-28 sm:h-28 md:w-32 md:h-32`

4. **Avatar frame** (line 798): grow on mobile.
   - `w-44 h-44 sm:w-64 sm:h-64 md:w-72 md:h-72` → `w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72`

This yields a mobile ratio of ~3.4× (192px vs 56px) instead of ~2.2× (176 vs 80), making the avatar clearly the hero, while staying within a 320px viewport (56 + 36 arrow + 192 + 12 gaps + 16 padding ≈ 312px).

## Out of scope
- No changes to tablet/desktop sizes (`sm:`/`md:` values), copy, pills, arrow, loader, validation grid, upload box, or any logic.
- No changes outside the side-by-side avatar block.
