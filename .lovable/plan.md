

## Plan: Add Coloring Icon to BookHeader Toolbar

### What will change

#### 1. `src/components/story/book-frame/BookHeader.tsx`
- Add `Palette` icon import from `lucide-react`
- Add `onColoring?: () => void` prop to `BookHeaderProps`
- Add a new icon button (🎨 Palette) in the center actions area, between the Download PDF and Save Offline buttons
- The button calls `onColoring` when clicked, with tooltip "דפי צביעה"

#### 2. `src/pages/StoryViewer.tsx`
- Add a `handleColoringFromHeader` function that opens the coloring picker dialog directly (same logic as the existing print button on the completion screen — sets mode, checks cache, opens `coloringPickerOpen`)
- Pass `onColoring={handleColoringFromHeader}` to `<BookHeader>`

### What stays the same
- All existing coloring dialog logic, picker, print/online flow
- All other BookHeader buttons and behavior
- Completion screen coloring buttons still work as before

