

## Plan: Fix Photo Box — Side-by-Side Layout in One Unified Box

### Problem
The current layout shows circular avatars that are too small (w-20 h-20). The side-by-side view only appears when an avatar exists or is generating — otherwise it shows a single small circle. The user wants a unified rectangular box with two equal-sized images side by side, matching the original design.

### Changes — `src/components/wizard/ChildInfoStep.tsx`

**Replace the entire photo display section (lines 741-884)** with a unified box layout:

1. **When photo exists AND (avatar exists OR generating)** — show ONE box with two images side by side:
   - Right side: original photo as a square/rectangle (not circle), label "תמונה מקורית" underneath
   - Left side: avatar image (or spinner if generating), label "דמות בסיפור" underneath
   - Both images same size (~32x32 or flex-1), inside one bordered container
   - Sparkles icon between them

2. **When photo exists but no avatar** — show the original photo (larger, not tiny circle) with "צור אווטאר" button

3. **Buttons** (צור אווטאר / עדכן אווטאר / מחק) stay below the images inside the same box

**Key styling changes:**
- Images: `w-28 h-28 rounded-xl` (square with rounded corners, not circles)
- Container: single `border-2 border-purple-400 rounded-xl` box wrapping both
- Labels: `text-[11px]` centered below each image
- Use `flex items-start justify-center gap-4` for side-by-side layout

### Files modified
1. `src/components/wizard/ChildInfoStep.tsx` — restructure photo display area (lines 741-884)

