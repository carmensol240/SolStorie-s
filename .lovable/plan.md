## Two changes

### 1) Closing page button → preview modal (StoryViewer.tsx)

**Button (line ~1481-1493):**
- Change label to: `👁️ ראו איך הספר של {story.child_name} ייראה מודפס!` (replace printer icon with Eye icon).
- On click: open a new local modal (`showPrintPreviewModal` state) instead of calling `exportToPdf` / `setShowBuyToPrintDialog` directly.

**New modal `PrintBookPreviewModal`** (new component `src/components/story/PrintBookPreviewModal.tsx`):
- Reuses the existing flipping-book visual language from `FlippingBookAnimation` (same CSS `flipping-book.css`), but parameterized:
  - Cover image: `story.cover_url`
  - Child name overlay on cover (already supported via the dynamic title pattern just added in `FlippingBookAnimation`).
  - A simple flip animation cycling through 3-4 of the story's first illustrations (`story.pages[*].illustration_url`) shown on the right page.
- Bottom of modal:
  - Text: `קובץ PDF מוכן להדפסה – הדפיסו בבית או שלחו לבית דפוס`
  - Primary button: `🖨️ להורדת קובץ ה-PDF המלא`
    - If `hasPurchasedPackage` → call `exportToPdf(story)` and close modal.
    - Else → close modal and `setShowBuyToPrintDialog(true)` (existing purchase popup, unchanged).

**Out of scope:** existing `BuyToPrintDialog`, PDF generation logic, coloring buttons, feedback box — untouched.

### 2) Confirm existing plan
- Approve the already-implemented change in `FlippingBookAnimation.tsx` showing the active child's name from the `children` table (fallback `הסיפור שלך`). No further code changes needed there.

## Files touched
- `src/pages/StoryViewer.tsx` — change button label/icon + wire new modal state.
- `src/components/story/PrintBookPreviewModal.tsx` — new modal component (uses existing `flipping-book.css`).

Nothing else changes.