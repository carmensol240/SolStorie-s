

## Plan: Fix Coloring Page — Download PNG + Loading Message

### Changes

**File: `src/pages/StoryViewer.tsx`**

1. **Replace `window.open` print flow with direct PNG download** (lines 1450-1480):
   - Convert the base64 image data to a Blob
   - Create an `<a>` element with `download` attribute and trigger `.click()` — this bypasses popup blockers entirely
   - Filename: `דף-צביעה-${story.topic}.png`

2. **Add a visible loading toast** after `setColoringLoading(true)` (line 1436):
   - Show a toast: `"מכין את דף הצביעה שלך... זה לוקח כ-30 שניות 🎨"`
   - Use the existing `toast()` with a descriptive message

3. **Update button text** while loading (line 1492) — already says "יוצר דף צביעה...", keep as-is.

### What stays the same
- Edge function — unchanged
- Illustration picker dialog — unchanged
- All other end-page content — unchanged

