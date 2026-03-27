

## Plan: Illustration Picker Dialog for Coloring Page

### Change

**File: `src/pages/StoryViewer.tsx`**

1. **Add state** for the picker dialog:
   - `coloringPickerOpen: boolean` — controls dialog visibility
   - `selectedColoringUrl: string | null` — the chosen illustration URL

2. **Replace the button's `onClick`** (lines 1367-1427):
   - Instead of immediately calling the edge function with the first illustration, collect all illustrations from `story.pages` that have `illustration_url`, resolve them via `getPublicIllustrationUrl`, and open the picker dialog.

3. **Add a Dialog component** (after the button, inside the end-page section):
   - Shows a grid of all story illustrations as thumbnails (2-3 columns)
   - Each thumbnail is clickable — sets `selectedColoringUrl`
   - Selected thumbnail gets a purple border highlight
   - "יצירת דף צביעה" confirm button at the bottom
   - On confirm: closes dialog, sets `coloringLoading`, calls `generate-coloring-page` with the selected URL, then opens the print window (same logic as current)

### What stays the same
- Edge function — unchanged
- Print window HTML — unchanged
- All other end-page content — unchanged

