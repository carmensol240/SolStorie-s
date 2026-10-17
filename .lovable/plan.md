# Blank prints on every page except coloring pages

## What I found
- In the current version (preview), this is **already fixed**. The rule that hides the screen applies only while the coloring page's "Print A4" button is printing. The button adds a temporary marker just before the print dialog opens and removes it in `afterprint`.
- The live site (soulstory.co.il) still runs **the older version**, where the rule hides everything on every print. That's why you still see blank pages there. It will only be fixed live after you publish.
- Other print rules in the site:
  - The story print rule hides buttons and navigation and turns dark backgrounds white. It does not hide the story content.
  - The online coloring canvas prints in its own separate window, so it doesn't affect other pages.
  - No other site-wide print rule hides content.

## What I'll still add (small safety net)
1. If the print is cancelled, or the browser never sends the "print finished" signal (some phones and Safari), the marker is also removed:
   - when the user returns to the page
   - or after 60 seconds at the latest
   This way the next print of a story can never come out blank.
2. A small automated test: after a coloring-page print, the marker is gone, and normal printing isn't affected.

## Checks after the change
- Print a coloring page: only the drawing prints, on one full A4 page.
- Ctrl+P on a story: the content prints, not a blank page.
- Ctrl+P on a regular page (home, library): not blank.
- Print a coloring page, cancel it, then print a story right away: the story is not blank.
- The book PDF for printing is unchanged (it doesn't use these rules at all).
- After that, publish so the fix reaches the live site.

## Technical details
- `src/lib/coloring-a4.ts` `printColoringA4`: keep the existing `afterprint` cleanup, and also run the same `cleanup` from `window.focus` (once, after print) and from `setTimeout(60000)`. Make `cleanup` idempotent.
- No changes to `src/index.css`, `StoryViewer.css`, `OnlineColoringCanvas.tsx`, `use-pdf-export.ts`.
- Test in `src/__tests__/coloring-a4.test.ts` (jsdom): after calling cleanup, `body` no longer has `printing-coloring-page` and `#a4-print-root` is gone.
- Verify with Playwright `page.pdf()` on a story page: the PDF contains the story text.
