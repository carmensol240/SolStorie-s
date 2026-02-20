
# PDF Export Fixes — A4 Layout, Text Wrapping, Clickable Link & Centered Footer

## Current Issues

1. **Text Cutting** — The portrait spread puts both the illustration AND two text blocks inside a fixed-height `div` that matches the A4 page pixel-for-pixel. When a story page has long Hebrew text, the text overflows and gets clipped during `html2canvas` capture.

2. **URL Not Clickable** — `buildFooterHtml()` renders the URL as a plain `<span>` styled blue. `addClickableLink()` adds a jsPDF invisible link overlay BUT it is hardcoded to `pageWidth/2 - 30` with a fixed 60mm width — it does not actually make the rendered text clickable in all PDF viewers.

3. **Footer Not Centered on Every Page** — The footer is `position:absolute; bottom:0` inside the page container. On the landscape layout, the footer is injected per-page correctly, but in portrait it sometimes gets buried under the inner bordered `div` which has `flex:1` and takes up all the space.

4. **No Automatic Page Break for Long Text** — Long story text is forced into a fixed `flex:0 0 40%` height slot. No overflow or pagination logic exists.

5. **Margins** — The A4 page currently has padding of 20–24px pixels on the HTML element, which does not precisely translate to 20mm PDF margins. Images and text can touch the edges.

---

## Solution: Rewrite `exportPortrait` with a proper per-element rendering approach

### Key Changes in `src/hooks/use-pdf-export.ts`

#### 1. Proper 20mm A4 Margins
Set the container width to `(210 - 40) mm = 170mm` worth of pixels (i.e., `170 * 3.78 = 642px`) so everything inside respects the margin from the start. The PDF `addImage` call will be offset by 20mm (x=20, y=20) and sized to `170 × (297-40) = 170×257mm`.

#### 2. Text Wrapping via jsPDF native text rendering (no html2canvas for text)
Switch to a **hybrid approach**:
- **Images**: still rendered via `html2canvas` → `addImage` (because Hebrew fonts render correctly in the browser)
- **Text blocks**: rendered using `jsPDF.text()` with `jsPDF.splitTextToFitWidth()` so text never overflows — it wraps automatically and overflows to a new PDF page when needed

This is the cleanest fix and avoids the fixed-height container problem entirely.

#### 3. Clickable Footer Link on Every Page
Use `pdf.textWithLink()` (jsPDF native) to render the URL as a real clickable hyperlink text — no invisible overlay needed:
```typescript
pdf.setTextColor(37, 99, 235); // blue
pdf.textWithLink('soulstory.co.il', x, y, { url: 'https://soulstory.co.il' });
```

#### 4. Centered Footer on Every Page
After all content is placed, a `drawFooter(pdf)` helper draws the footer at the bottom of the **current** page using jsPDF coordinates (not html2canvas), guaranteeing it is always centered and never cut off:
```typescript
const drawFooter = (pdf: jsPDF) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const y = pageHeight - 12; // 12mm from bottom
  // SolStorie's™ | עולמה הקסום של סול
  // soulstory.co.il (clickable)
};
```

---

## Architecture of the New `exportPortrait` Function

```text
exportPortrait(story)
  │
  ├─ Page 1: Cover (html element → html2canvas → addImage at 20,20 sized 170×257mm)
  │          + drawFooter()
  │
  ├─ For each story page:
  │   ├─ addPage()
  │   ├─ If illustration: load image → addImage (right half, 20mm margin)
  │   ├─ splitTextToFitWidth(page.text, 130mm) → array of lines
  │   ├─ For each line: pdf.text(line, x, y) — advance y
  │   ├─ If y exceeds page bottom (297-30mm): addPage(), reset y, drawFooter() on previous page
  │   └─ drawFooter() on current page
  │
  └─ save()
```

### Image placement (portrait, with illustration):
- Illustration: top portion, full width (170mm wide × ~120mm tall), centered
- Text: below illustration, starting at y=155mm, wrapping within 170mm width

### Image placement (portrait, no illustration):
- Text: full page, starting at y=40mm (top margin), wrapping within 170mm width

---

## Files to Edit

**Only one file:** `src/hooks/use-pdf-export.ts`

### Specific changes:

1. **Remove `buildFooterHtml()`** — replaced by native jsPDF footer drawing
2. **Remove `addClickableLink()`** — replaced by `pdf.textWithLink()` inside `drawFooter()`
3. **Remove `createPdfPage()`** — replaced by direct jsPDF calls per element
4. **Rewrite `exportPortrait()`** — full rewrite using jsPDF native text with `splitTextToFitWidth`, 20mm margins, per-page text wrapping with automatic new-page logic
5. **Keep `exportLandscapeBook()`** — add footer fix: replace the HTML footer injection with `drawFooter()` called after each `createPdfPage()` call

### New `drawFooter()` helper:
```typescript
const drawFooter = (pdf: jsPDF) => {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  
  // Separator line
  pdf.setDrawColor(212, 165, 116);
  pdf.line(20, H - 18, W - 20, H - 18);
  
  // Brand name (purple, bold)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(147, 51, 234);
  pdf.text("SolStorie's™", W / 2 - 20, H - 13, { align: 'center' });
  
  // Hebrew tagline (gray)
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(153, 153, 153);
  pdf.text(' | עולמה הקסום של סול', W / 2 + 10, H - 13);
  
  // Clickable URL (blue)
  pdf.setFontSize(8);
  pdf.setTextColor(37, 99, 235);
  pdf.textWithLink('soulstory.co.il', W / 2, H - 8, { 
    url: 'https://soulstory.co.il',
    align: 'center'
  });
};
```

---

## What Stays the Same
- `buildSpreads()` — unchanged
- `loadImageAsDataUrl()` — unchanged  
- `exportLandscapeBook()` — only the footer rendering is updated (HTML footer removed, `drawFooter()` added after each `createPdfPage()` call)
- `exportToPdf()` entry point — unchanged
- All types/interfaces — unchanged
