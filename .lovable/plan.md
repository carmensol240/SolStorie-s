

## Plan: Fix Print Coloring Page Button

### Problem
The "הדפיסו דף צביעה" (Print Coloring Page) button doesn't work because it uses `window.open(url, '_blank')` which is blocked by mobile browsers' popup blockers — especially when called after an async operation (the dialog closes first, then the edge function runs, then `window.open` fires outside the user gesture context).

Even when there IS a cached URL, `window.open` on mobile Safari/Chrome can be unreliable.

### Solution — single file: `src/pages/StoryViewer.tsx`

**Lines 1991–2021** (the print button's `onClick` handler):

Replace `window.open(urlToUse, '_blank')` with a proper download/print approach:
- Create a temporary `<a>` element with `href` set to the coloring image URL, `download` attribute set, and programmatically click it
- This triggers a reliable download on mobile without popup blockers interfering
- For the async (non-cached) path: keep the dialog open while loading (don't close it prematurely), generate the URL, then trigger the download

Specifically:
1. **Cached path** (line 1996): Replace `window.open(urlToUse, '_blank')` with a fetch-and-download approach using `URL.createObjectURL` + temporary anchor click
2. **Non-cached path** (lines 1999–2020): Don't close the dialog before the async call. After getting the URL, trigger the same download approach, then close the dialog

### What stays the same
- Online coloring button logic (already working)
- Edge function (no changes)
- All other components and pages

