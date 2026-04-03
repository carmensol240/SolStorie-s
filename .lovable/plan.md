

## Plan: Add Online Coloring Feature

### Overview
Add a "צבעי אונליין" button next to the existing print coloring button. It reuses the same image picker dialog, then opens a full-screen coloring canvas with the chosen illustration as background.

### Changes

#### 1. New component — `src/components/story/OnlineColoringCanvas.tsx`

A full-screen coloring overlay that:
- Loads the coloring page image (from `generate-coloring-page` edge function) as a background
- Provides a color palette (same fun colors as `DrawingCanvas`)
- Brush tool with size options
- Eraser tool
- "שמור" button — saves as PNG download
- "הדפס" button — opens print dialog
- "חזרה" button — closes and returns to picker or completion page
- Canvas layering: background layer (coloring outline) + drawing layer on top

Structure similar to existing `DrawingCanvas` but with background image support and save/print functionality.

#### 2. Update — `src/pages/StoryViewer.tsx`

**New state:**
- `onlineColoringOpen` (boolean)
- `onlineColoringImageUrl` (string | null) — the generated coloring page data URL
- `onlineColoringPickerOpen` (boolean)
- `selectedOnlineColoringUrl` (string | null)
- `onlineColoringLoading` (boolean)

**Add button** (line ~1369, after the print coloring button):
```tsx
<Button onClick={() => openOnlineColoringPicker()} ...>
  🎨 צבעי אונליין
</Button>
```

**Add picker dialog** — same grid as existing print picker, but on confirm calls `generate-coloring-page`, then opens the `OnlineColoringCanvas` with the result instead of downloading.

**Import** the new `OnlineColoringCanvas` component and render it conditionally.

### Files modified
1. `src/components/story/OnlineColoringCanvas.tsx` — new full-screen coloring component
2. `src/pages/StoryViewer.tsx` — add button, picker, and state for online coloring

