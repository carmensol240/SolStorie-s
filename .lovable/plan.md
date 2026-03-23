

## Plan: Fix Duplicate Text Bug in Story Viewer

### Root Cause

In `src/pages/StoryViewer.tsx` lines 1042-1096, the ages 3+ virtual page builder:
1. Creates a text-only page for **every** DB page that has text
2. Then creates illustration pages that **also display the same text** as an overlay

This means text from pages with illustrations appears twice.

### Fix (single file: `src/pages/StoryViewer.tsx`)

**Replace the ages 3+ virtual page logic (lines 1042-1096)** with simple per-page logic:

For each DB page (skipping the cover illustration page):
- If it has an illustration → create an `'illustration'` virtual page (text will be shown as overlay on the image, as it already does)
- If it has no illustration but has text → create a `'text'` virtual page (dark starry background)

This ensures each sentence appears exactly once. No text/illustration splitting, no interleaving pattern.

### What stays the same
- Toddler (0-2) combined page logic — unchanged
- Cover illustration selection — unchanged
- All rendering code for illustration pages, text pages, combined pages — unchanged
- Star dots, dedication, closing page — unchanged

