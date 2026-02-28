

## Fix: 2-Text + 1-Illustration Page Pattern & Hooks Error

### Problem
- Current layout alternates illustration+text / text-only per DB page
- User wants: **2 full-text pages → 1 full-screen illustration page (no text)**, repeating
- React Hooks error from conditional hook calls

### Solution: Virtual Pages Array

Build a `virtualPages` array via `useMemo` at the top level that maps DB pages into the 2-text-1-illustration pattern.

**File: `src/pages/StoryViewer.tsx`**

1. Add `useMemo` to build `virtualPages` array from `story.pages`:
   - Iterate DB pages sequentially
   - Add each page as a `{type: 'text', page}` entry
   - After every 2 text entries, if any of those 2 DB pages has an illustration, insert a `{type: 'illustration', illustrationUrl, illustrationPrompt}` entry
   - This produces the repeating pattern: text, text, illustration, text, text, illustration...

2. Replace `currentPage` content indexing:
   - Cover = -1, Dedication = 0, virtual pages = 1..N, closing = N+1, end = N+2
   - `totalStoryPages` becomes `virtualPages.length`
   - Navigation uses virtual page index

3. Refactor rendering block (lines 1013-1086):
   - `type === 'illustration'`: full-screen image, no text, `object-contain`, with skeleton if generating
   - `type === 'text'`: text on rainbow background (same as current text-only layout)

4. Ensure all hooks (`useMemo`, `useEffect`, `useState`) are above every early `return`

5. Read-aloud button already removed — no changes needed

### Virtual page mapping example
```text
DB pages: [p1(ill), p2, p3(ill), p4, p5(ill), p6, p7(ill), p8]
Virtual:  [text-p1, text-p2, ill-p1, text-p3, text-p4, ill-p3, text-p5, text-p6, ill-p5, text-p7, text-p8, ill-p7]
```

### What stays unchanged
- Cover page, Dedication page, Closing page, End/feedback page — no layout changes
- Navigation arrows, keyboard nav, Realtime subscription
- BookHeader, all dialogs

### Files to edit
| File | Change |
|------|--------|
| `src/pages/StoryViewer.tsx` | Virtual pages array + rendering refactor + hooks fix |

