# A4 print-ready coloring pages

## What changes for the user
- New coloring pages are drawn as full-page portrait pages shaped like A4.
- Every coloring page (new and existing) shows inside a white A4-shaped frame. Nothing is cropped.
- Each coloring page gets two new buttons: "Print A4" and "Download PDF (A4)".
- Printing shows only the coloring page, centered on one A4 sheet with 10 mm margins.
- The PDF is one A4 portrait page named `<child or story name>-coloring-page-A4.pdf`.
- Existing pages are not regenerated. They just get the new frame, print and PDF buttons.

## 1. Image generation (coloring page backend function)
- Ask the image model for a portrait shape. The models only support set shapes, so we use 2:3 (the closest supported portrait to A4's 1:1.414). We still frame and print it as A4 without cropping, so a slightly different shape only adds a thin white margin.
- Add this line to the prompt: "full-page portrait composition in A4 proportions, the illustration fills the whole page from edge to edge, pure white background, clean bold black outlines, no gray shading, no text".
- Keep the current models, retries and credit rules.

## 2. Display
- One shared A4 frame: white background, `aspect-ratio: 210 / 297`, small inner margin, image centered with `object-fit: contain`.
- Used in the Library coloring grid (replacing the square box) and in the story's coloring preview.

## 3. Printing
- "Print A4" opens a print-only view with just the image, then calls the browser print dialog.
- Print CSS: `@page { size: A4 portrait; margin: 10mm; }`. Hide header, buttons, navigation and all other app UI. The image uses `max-width: 100%; max-height: 277mm; object-fit: contain`, centered, `break-inside: avoid`, so it never splits across two pages.
- The browser's print dialog also offers "Save as PDF".

## 4. PDF download
- jsPDF (already in the app): A4 portrait in mm, image centered inside 190 × 277 mm with its proportions kept.
- The image is redrawn on a 2480 × 3508 px white canvas (300 dpi A4) before it goes into the PDF.
- Honest limit: the AI model returns images around 1–2K px. We make the PDF at full 300 dpi size, but that can't add detail the image doesn't have. Bold outlines should still print cleanly.
- File name: child name or story topic + `-coloring-page-A4.pdf`, with characters that aren't allowed in file names removed.

## 5. Existing pages
- They use the same frame, print and PDF code, which works from the saved image. Nothing is regenerated and no credits are used.

## Technical details
- `supabase/functions/generate-coloring-page/index.ts`: add the prompt text and `image_config: { aspect_ratio: "2:3" }` to the request body. Then redeploy.
- New `src/components/coloring/A4ColoringFrame.tsx` (frame plus the two buttons) and `src/lib/coloring-a4.ts` (`printColoringA4(url)`, `downloadColoringPdfA4(url, name)`). The PDF uses canvas → JPEG 0.95 → `jsPDF.addImage`. Images come from the public bucket and load with `crossOrigin="anonymous"`.
- Print: a hidden `#a4-print-root` portal plus an `@media print` block in `src/index.css` that hides everything except that portal (`body > *:not(#a4-print-root)`).
- Wire the frame into `src/pages/Library.tsx` (coloring grid) and the StoryViewer coloring print/preview step. The online coloring canvas is not changed.
- Verify: generate one new page and check its shape; in the browser, open print preview (one page, not cropped); download the PDF and check one A4 page of 2480 × 3508 px.
