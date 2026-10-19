# Print file as a real 21x21 cm book

## Goal
The print file (PDF) comes out as a ready-to-print square book: exact size with bleed, no cropped pictures, sharp images, correct page order, the right language, and no emojis.

## What changes for the parent
- The PDF page is 216x216 mm (21x21 cm book + 3 mm bleed on each side).
- Every picture shows in full. The empty space around it is filled with an enlarged, blurred copy of the same picture, up to the edge of the bleed.
- Pictures are sharpened for print the first time a print file is made for a story, then reused.
- Page order: cover, inside cover, dedication, then each text on a left page (even number) with its picture facing it. If a page has no picture, a decorative page goes in its place. Blank pages are added before the back cover so the total is a multiple of 4.
- English stories get English fixed texts and a left-to-right layout.
- A short note next to the download button: "ספר ריבועי 21×21 ס"מ עם 3 מ"מ לחיתוך. בהדפסה בבית: גודל אמיתי (100%). במכון הדפסה: כריכה בצד ימין (בספר באנגלית: בצד שמאל)." (English stories show the English version.)

## Page order

```text
1  Front cover (full bleed)
2  Inside cover: "הספר הזה שייך ל-" / "This book belongs to" + line
3  Dedication
4  Text of story page 1      5  Picture of story page 1 (or decorative page)
6  Text of story page 2      7  Picture of story page 2
...
   "The End" page
   Blank pages until total % 4 == 0
last  Back cover
```
"The End" sits on the next free page. The blank padding goes after it and before the back cover.

## Layout rules
- Units are mm. Every page is rendered at 300 DPI: 2551x2551 px.
- Safe area: text, logo, page numbers and the QR code stay at least 13 mm from the file edge (10 mm inside the cut line).
- Backgrounds, covers and picture fills extend to the file edge.
- The watermark logo on pictures stays on purpose. It gets moved into the safe area.
- Text pages get a small page number at the bottom, inside the safe area. Picture, cover and blank pages get no number.
- Text pages are saved as PNG, so the letters stay sharp. Picture and cover pages are saved as high-quality JPEG to keep the file size down.
- Before each capture: wait for `document.fonts.ready`, and make sure Heebo has loaded.
- Emojis (✨💛🎙️🎵🎨🖍️📱🌟) are replaced with small inline SVG icons (star, heart, mic, note, palette, crayon, phone) or removed.

## Sharpening pictures for print (upscale)
- A new backend function, `upscale-print-illustrations`, takes a story ID. It checks that the caller owns the story or is an admin, and it does NOT check payment. The download entitlement check in the browser stays exactly as it is.
- For each picture without a stored print version, it calls the FAL upscaler (ESRGAN, 4x) and saves the result at 2551 px or more on the long side to `story-illustrations/{storyId}/print/page-N.jpg` (JPEG, quality 92). The path is saved on the page row (new nullable column `print_illustration_url`).
- Later downloads reuse the stored file. If upscaling fails or times out for a page, that page uses the original picture and the PDF still gets made.
- Reader pictures and their creation are not touched. The reader keeps using the original and the WebP reading version.

**Estimated cost:** ESRGAN on FAL is billed by compute time, about $0.002–0.005 per picture, so roughly 0.10–0.25₪ for a 12–16 picture story, paid once per story. (Clarity Upscaler gives finer detail but costs about $0.03–0.05 per picture, around 2–3₪ per story. I recommend ESRGAN and will report the real cost from the test.)

## Phone memory
- One page at a time: render, add it to the PDF, then clear the canvas (set width/height to 0) and the DOM node before the next page.
- The blurred fill is drawn on a small canvas (about 256 px) and stretched up. Safari has no `ctx.filter`, so this works there too.
- 2551x2551 canvas ≈ 26 MB, which is under the iPhone canvas limit. html2canvas runs at scale 1 on a 2551 px design (not scale 2).
- Pictures load as blobs or object URLs, which are revoked after use. No base64 strings get kept around.
- Test on a 375px Playwright mobile profile with a long story. The file must be created without a crash.

## Not touched
`verifyPdfEntitlement`, payments, price checks, creating the reader pictures, and the reader itself.

## Test after building
Make a print file for "אבא במילואים" and for the latest test book with wide pictures. Report: page size in mm (read from the PDF), page count and that it's a multiple of 4, which pages are text and which are pictures or decorative, file size, and the resolution of each picture after upscaling (with any fallbacks). Include screenshots of a wide-picture page, a text page with its number, and the cover.

## Technical details
- `src/hooks/use-pdf-export.ts`: `new jsPDF({ unit: 'mm', format: [216, 216] })`, no px_scaling. `addImage` at (0,0,216,216). Footer drawn in mm inside 13 mm. A `buildPageSequence(story)` pure function returns typed slots (cover / insideCover / dedication / text / illustration / decorative / theEnd / blank / backCover). Fixed texts come from a `PRINT_TEXTS[he|en]` map with `dir` per language, where language = `story.language === 'en'`. The illustration page uses a contain image over a blurred-cover background, and the watermark stays inside the image.
- New `src/lib/print-layout.ts` (pure: sequence + padding + constants), plus `src/__tests__/print-layout.test.ts`: missing picture → decorative slot, never shifts; total % 4 === 0; back cover last; text on even pages; English → ltr/English strings; 216 mm / 2551 px constants.
- Before building, the hook calls `upscale-print-illustrations` and waits (with an overall timeout of about 90 s, and pages running in parallel with a limit of 3). It uses the returned print URLs, otherwise the originals.
- Migration: `story_pages.print_illustration_url text null`, with no change to RLS (it's covered by existing owner policies). The edge function uses the service key for the storage write, following the project's storage rule.
- Download note added in `StoryViewer.tsx` next to the download action (UI text only).
- AGENTS.md: one rule about the print file spec, the print-only upscaled copies, and the page order.
