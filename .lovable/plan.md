

## Plan: Fix Coloring Icon — Dialog Not Rendering Outside End Page

### Problem
The coloring picker Dialog, OnlineColoringCanvas, and Coloring Upsell AlertDialog are all rendered **inside** the `isEndPage` conditional block (lines 1473–1793). When the user clicks the 🎨 icon from the header on a story page, `coloringPickerOpen` is set to `true` but the Dialog component doesn't exist in the DOM — so nothing opens.

### Solution — single file: `src/pages/StoryViewer.tsx`

Move these three components **outside** the conditional page rendering block (cover/CTA/end/story pages) so they render regardless of which page is displayed:

1. **Coloring Picker Dialog** (lines ~1472–1761)
2. **OnlineColoringCanvas** (lines ~1764–1770)
3. **Coloring Upsell AlertDialog** (lines ~1772–1793)

These will be placed after the `TheaterFrame` closing tag, at the same level as other global dialogs. The logic inside them stays identical — only their position in the JSX tree changes.

### What stays the same
- All coloring logic, picker flow, print/online actions
- The end page layout (feedback, back arrow, logo)
- BookHeader icon and its `onColoring` handler
- All other pages and components

