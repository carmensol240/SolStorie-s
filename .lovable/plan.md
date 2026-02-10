

## Redesign of the "Child's World" (עולם הילד) Profile Screen

### Overview
A comprehensive visual and structural redesign of `/profile` to create a premium parent-child dashboard. The screen will be reorganized with dominant child profile photos at the top, a cleaner tips section, and removal of CTA/accessibility elements.

### Changes to `src/pages/Profile.tsx`

#### 1. Dominant Profile Header with All Children
- Replace the current compact header (small 56px avatar + name + credits inline) with a new prominent section:
  - Center-aligned greeting ("שלום, [name]") at the very top with credits badge
  - Below it, a horizontal row of **all** children's profile photos as large circular frames (80x80px each)
  - Each circle shows the child's photo (via `SignedImage` for private storage paths) with a gradient border (purple-to-pink)
  - Below each photo: the child's name in white text
  - If no photo exists, show the child's initial letter in a gradient circle (existing pattern, but larger)
- Store all children's `photo_url` values (not just the first child) for rendering

#### 2. Redesigned "הטיפ של כרמית" Section
- Keep the rotating tips mechanism (12-second interval, same `CARMIT_TIPS` array)
- Add the new NLP-focused tip: "נסו להשתמש בשאלות 'איך' במקום 'למה' כדי לעודד את הילד לשתף פעולה ולחשוב על פתרונות."
- Visual refinement: cleaner glassmorphism box, right-aligned text, attribution line "כרמית כהן, מייסדת StoryTime"
- **Remove** the coaching CTA button ("רוצה ליווי אישי וכלים נוספים? לחצי כאן") entirely

#### 3. Keep Existing Functionality
- "עולם הילד" expandable child cards with hobbies/challenges/friends fields -- unchanged
- "פנקס הקסם להורה" notebook fields (discussion topics, goals, magic moments) -- unchanged
- Save buttons and toast notifications -- unchanged
- All data fetching and saving logic -- unchanged

#### 4. UI Cleanup
- Remove the `Sparkles` icon import and coaching CTA button (lines 253-259)
- Ensure all images use `object-cover` (already applied, will verify)
- No accessibility/read-aloud buttons on this screen (none present currently)
- Name consistency: "כרמית כהן" remains as-is in the tips attribution

#### 5. Technical Details

**File: `src/pages/Profile.tsx`**

- **State changes**: Replace single `childPhotoUrl` state with a `childPhotos: Record<string, string>` mapping child ID to photo_url, populated from the existing `fetchChildren` query
- **Import**: Add `SignedImage` component for rendering private storage photos
- **Header section** (lines 216-238): Replace with centered greeting + horizontal children photo row
- **Tips section** (lines 240-260): Remove CTA button, add new tip to array, clean up styling
- **No other files need changes** -- all data queries already fetch the necessary fields

### Visual Layout (top to bottom)
1. Greeting + credits badge (compact row)
2. Children photo circles (horizontal, centered, scrollable if many)
3. "הטיפ של כרמית" box (clean, no CTA)
4. "עולם הילד" expandable cards (unchanged)
5. "פנקס הקסם להורה" notebook (unchanged)
6. Mobile navigation bar

