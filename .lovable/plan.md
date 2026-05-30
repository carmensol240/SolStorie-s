Add a lock-state indicator to the PDF/print icon in the book header for users without PDF entitlement.

## Changes

### `src/components/story/book-frame/BookHeader.tsx`
- Add `Lock` to the lucide-react imports.
- Add a new optional prop `pdfLocked?: boolean` to `BookHeaderProps` (and destructure with default `false`).
- In the "Download PDF" Tooltip block (lines 131–146):
  - Wrap the `FileDown` icon in a `relative` span and, when `pdfLocked`, overlay a small `Lock` badge in the corner (white circle background, slate icon, e.g. `absolute -top-1 -left-1 w-3.5 h-3.5 bg-white rounded-full p-[1px] text-slate-700 shadow-sm`).
  - When `pdfLocked`, change the `TooltipContent` text to `שדרגו לחבילת ההדפסה` (otherwise keep `הורד או הדפס PDF`).
- Keep the existing `onClick={onDownload}` so the upsell modal continues to open via the existing `guardPdfDownload` flow. Do not disable the button when locked.

### `src/pages/StoryViewer.tsx`
- Pass `pdfLocked={!canDownloadPdf}` to `<BookHeader … />` (around line 1641).

## Out of scope
No other behavior change. Entitlement logic, modal, and download flow remain identical.
