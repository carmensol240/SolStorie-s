
## Goal
Restructure the exported PDF only. The in-app story reader stays untouched.

## New PDF structure (square 2480x2480 px pages)

1. **Page 1 — Cover**: existing app cover illustration (`story.cover_url`) as full-bleed background + story title (topic) + child name overlay.
2. **Page 2 — Dedication**: clean white page with the text `הסיפור הזה נכתב במיוחד עבור ___` and several handwriting lines beneath it.
3. **Story pages**: for each story page, two separate PDF pages:
   - A **white text-only page** with just the page text (no illustration, no background).
   - A **white illustration-only page** with the illustration centered (no text overlay).
4. **Logo / footer**: `SolStorie's™ · soulstory.co.il` footer drawn exactly as today via `drawFooter`.

## Files to change

- `src/hooks/use-pdf-export.ts` — only file touched.
- `src/pages/StoryViewer.tsx` — pass `cover_url` into `exportToPdf` / `generatePdfFile` (it already exists on `story`, just extend the `Story` interface in the hook).

## Implementation details

### Page format
- Replace `jsPDF({ format: 'a4' })` with a square format: `new jsPDF({ orientation: 'portrait', unit: 'px', format: [2480, 2480], hotfixes: ['px_scaling'] })`.
- Both `exportPortrait` and `exportLandscapeBook` collapse into a single square `exportSquare` flow (layout argument kept for API compatibility but both branches call the same builder, since a square page has no orientation).
- Container sized at 2480x2480 px (no mm→px conversion needed).

### `Story` interface
Add `cover_url?: string | null` to the local `Story` type and forward it from `StoryViewer.tsx` (already on the story object).

### Renderers
- `renderCoverPage(childName, topic, language, coverUrl)` — uses `coverUrl` as the background `<img>`. Falls back to current `solMagicBookCover` asset only if `coverUrl` is missing. Keeps current title/child-name typography but scaled for 2480px canvas.
- `renderDedicationPage(childName)` — replace rainbow design with:
  - Pure white background.
  - Centered title: `הסיפור הזה נכתב במיוחד עבור ___` (Heebo, bold, RTL).
  - Below: ~8 evenly-spaced thin gray horizontal lines for handwriting (`border-bottom: 2px solid #d4d4d8`, generous spacing).
  - No emojis, no rainbow gradient.
- New `renderTextOnlyPage(text)` — white background, centered Heebo text, RTL, large font tuned for 2480px, comfortable margins. No illustration, no overlay, no page-number chip (footer still drawn).
- New `renderIllustrationOnlyPage(illustrationDataUrl)` — white background, illustration centered with `object-contain` so the full square art is visible without crop and without text overlay. If illustration missing, render a soft placeholder (no text).
- Remove the closing "cast waving farewell" page from the new flow (PDF now ends after the last illustration page) to honor the strict spec "שאר הדפים: כל עמוד טקסט … כל איור …". *(Confirm during review — current code adds a closing page; the new spec doesn't mention it.)*

### Page loop
```
addCover()
addDedication()
for each virtual page:
   addTextOnlyPage(page.text)
   addIllustrationOnlyPage(page.illustration_url)
```
`buildVirtualPages` (toddler merge logic) stays as is.

### Footer / logo
`drawFooter` kept exactly as is (logo wording, font, colors, link). Only its coordinates auto-adapt since it reads page width/height from jsPDF.

## Out of scope
- No changes to `StoryViewer`, `BookFrame`, `BookPage`, or any in-app reader UI.
- No backend, schema, or AI-pipeline changes.
- No change to filename, share sheet, or toast behavior.

## Verification
- Generate a PDF from an existing story and confirm: square pages, cover uses `cover_url`, dedication has lines, each story page yields one text page + one illustration page, footer logo unchanged.
