## Problem

Opening a story from the library crashes with the friendly ErrorBoundary screen ("רק רגע... משהו קטן קרה"). The browser console shows **React minified error #310** ("Rendered fewer hooks than expected"), with the stack pointing to `useRef` inside `src/pages/StoryViewer.tsx`.

## Root cause

`src/pages/StoryViewer.tsx` has two early `return` statements:

- Line 1515 — `if (isLoading) return <Spinner />`
- Line 1529 — `if (!story || story.pages.length === 0) return <NotFound />`

But three hooks are declared AFTER those returns:

- Line 1569 — `const textPageContainerRef = useRef<HTMLDivElement>(null);`
- Line 1570 — `const textPageTextRef = useRef<HTMLParagraphElement>(null);`
- Line 1571 — `useAutoFitText(textPageContainerRef, textPageTextRef, [...]);`

First render → `isLoading=true` → early-return skips those 3 hooks.
Next render → `isLoading=false` → component runs past the early returns and suddenly calls 3 more hooks than before → React throws #310.

This is hit every time a story is opened over a network slow enough to show the loading spinner (i.e. virtually always on mobile).

## Fix

Move the two `useRef`s and the `useAutoFitText(...)` call **above** the `if (isLoading)` early return, so they run on every render regardless of state. The values they depend on (`currentVirtual?.text`, `currentVirtual?.type`, `currentFontSize?.size`, `showNikud`, `currentPage`) are all already nullable-safe — we just need to compute `currentFontSize` before the early returns too (it's a pure lookup: `FONT_SIZES[fontSizeIndex]`).

### Edit plan (single file)

`src/pages/StoryViewer.tsx`:

1. Just before `if (isLoading) {` (around line 1515), insert:
   - `const textPageContainerRef = useRef<HTMLDivElement>(null);`
   - `const textPageTextRef = useRef<HTMLParagraphElement>(null);`
   - `const currentFontSizeForFit = FONT_SIZES[fontSizeIndex];`
   - `const currentVirtualForFit = (currentPage >= 0 && currentPage < virtualPages.length) ? virtualPages[currentPage] : null;`
   - `useAutoFitText(textPageContainerRef, textPageTextRef, [currentVirtualForFit?.text, currentVirtualForFit?.type, currentPage, currentFontSizeForFit?.size, showNikud]);`
2. Remove the duplicated declarations at lines 1569-1577 (the two `useRef`s and the `useAutoFitText` call). Keep `currentFontSize` where it is (still used below) — or replace it with the lifted constant.

The refs are still attached to the same DOM nodes lower in the JSX, so behavior is unchanged.

## Out of scope

No other files touched. No styling, business-logic, or backend changes — purely a hook-ordering fix.
