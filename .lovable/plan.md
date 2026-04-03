

## Plan: Fix Story Viewer First Page for All Ages

### Current Behavior
- Page `-1` (cover) shows a full-bleed cover image (`story.cover_url` or `solSuperheroWelcome` doll character) with a dedication overlay and "פתחו את הספר" button.
- This is the same for all age ranges.

### Changes — `src/pages/StoryViewer.tsx`

**Ages 0-2 (toddlers):**
- Skip the cover page entirely. Set `currentPage` initial value to `0` when `isToddler` is true.
- Block backward navigation past page 0 for toddlers.
- No dedication page, no doll character — story starts immediately with combined illustration+text pages.

**Ages 3+ (non-toddlers):**
- Replace the cover page content (lines 1260-1304): Remove the full-bleed `solSuperheroWelcome`/cover image background entirely.
- Instead, show a styled dedication-only page with dark gradient background, centered text: "הספר הזה נוצר במיוחד עבורך, [childName] 💙", and the "פתחו את הספר" CTA button.
- No doll character image, no cover_url image on this page.

**Specific code changes:**

1. **Initial page state** (line 192): Change from always `-1` to conditionally `0` for toddlers. Since `story` isn't loaded yet at init, handle this in the story fetch callback or a useEffect that sets `currentPage` to `0` when `isToddler` is detected.

2. **Cover page rendering** (lines 1260-1304): Replace the cover image block with a styled gradient page showing only the personalized message and CTA button. Remove references to `solSuperheroWelcome` and `story.cover_url` from the cover page.

3. **Navigation guard** (line 1193): For toddlers, prevent navigating to page `-1` (no cover page exists).

4. **Remove `solSuperheroWelcome` import** (line 63) if no longer used anywhere.

### Files modified
1. `src/pages/StoryViewer.tsx` — replace cover page, skip cover for toddlers

