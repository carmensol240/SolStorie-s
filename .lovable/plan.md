

## Plan: Trim White Margins from Print Coloring Page

### Problem
The AI-generated coloring page image has large white margins (especially at the bottom). The online coloring canvas already trims these using `getContentBounds()`, but the print/download flow downloads the raw image as-is.

### Solution — single file: `src/pages/StoryViewer.tsx`

**In the `triggerDownload` function (lines 1994–2009)**: After fetching the image blob, add a canvas-based trim step before downloading:

1. Load the blob into an `Image` element
2. Draw it on a temporary canvas
3. Scan for content bounds (same white-threshold logic as `OnlineColoringCanvas.getContentBounds`)
4. Create a new canvas with only the trimmed content
5. Export the trimmed canvas as PNG blob and trigger download with that

This reuses the same trimming algorithm already proven in `OnlineColoringCanvas` (lines 59–121), just inlined into the download helper.

### What stays the same
- Online coloring canvas (no changes)
- Edge function (no changes)
- All other buttons and logic

