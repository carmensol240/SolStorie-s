

## Analysis

From the screenshots, the zoo story illustrations show **black bars at the top and bottom** of the image frame, making them look like embedded screenshots rather than full-bleed illustrations. The user wants images to fill the entire frame with no black bars or margins.

**Root Cause**: The page container `<div className="relative flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden">` has no explicit background color set. When the image's aspect ratio doesn't perfectly match the container, the default transparent/black background shows through as letterbox bars. Despite using `object-cover`, the flex layout may cause the inner `<div className="h-full w-full relative">` not to stretch fully.

## Plan

### 1. Fix container background in StoryViewer.tsx
- Add a warm background color to the main page frame container (matching the story theme) so any gap between the image and container edge shows a warm color instead of black.
- Add `bg-[#F5E6D3]` (or similar warm tone) to the outer rounded container div.

### 2. Ensure illustration wrapper fills the container
- Change the story page wrapper from `h-full w-full` to use `flex-1` within the flex-col container, ensuring it stretches to fill all available space.
- Add a matching background to the illustration wrapper div as well.

### 3. Apply same fixes to PublicStoryViewer.tsx
- Mirror the background and layout fixes for consistency.

### 4. Cover persistence fix verification
- Review the `handleRegenerateCover` function to ensure the DB update is awaited and verified before showing success.

### Files to edit:
- `src/pages/StoryViewer.tsx` — add background to container, fix illustration wrapper sizing
- `src/pages/PublicStoryViewer.tsx` — same fixes

