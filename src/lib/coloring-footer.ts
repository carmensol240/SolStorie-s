import solPage from "@/assets/coloring-gang/sol.png.asset.json";
import { coloringCorsUrl, prepareColoringCanvas, fitContain } from "@/lib/coloring-a4";
import { normalizeColoringPixels } from "../../supabase/functions/_shared/coloring-pixels";

/** Visual order right-to-left: the line is drawn segment by segment from the right edge. */
const COPYRIGHT_PARTS_PAID = ["© 2026 SolStories", "·", "soulstory.co.il"];
const COPYRIGHT_PARTS_FULL = ["© 2026 SolStories", "·", "soulstory.co.il", "·", "לשימוש אישי בלבד", "·", "אין למכור או להפיץ מחדש"];
export const COLORING_COPYRIGHT = "© 2026 SolStories · soulstory.co.il · לשימוש אישי בלבד · אין למכור או להפיץ מחדש";
export const COLORING_COPYRIGHT_PAID = "© 2026 SolStories · soulstory.co.il";
export const COLORING_FOOTER_TOP = 3050 / 3508;
export type ColoringPageSize = "preview" | "full";
export const COLORING_PREVIEW_SIZE = { width: 620, height: 877 };
export const COLORING_FULL_SIZE = { width: 2480, height: 3508 };
// No retained full-size cache: each consumer owns and releases its blob URL.
let drawingQueue: Promise<unknown> = Promise.resolve();

/** Draws the copyright line right-to-left: "© 2026 SolStories" rightmost, Hebrew leftmost. */
function drawCopyrightLine(ctx: CanvasRenderingContext2D, parts: string[]) {
  const maxWidth = 2240;
  const centerX = 1240;
  const y = 3450;
  let fontSize = 40;
  const measure = () => {
    ctx.font = `${fontSize}px Heebo, Arial, sans-serif`;
    const gap = fontSize * 0.35;
    const widths = parts.map((p) => ctx.measureText(p).width);
    return { widths, total: widths.reduce((a, b) => a + b, 0) + gap * (parts.length - 1), gap };
  };
  let m = measure();
  if (m.total > maxWidth) {
    fontSize = Math.max(24, Math.floor(fontSize * (maxWidth / m.total)));
    m = measure();
  }
  ctx.textAlign = "right";
  ctx.direction = "ltr";
  ctx.fillStyle = "#444444";
  let x = centerX + m.total / 2;
  parts.forEach((part, i) => {
    ctx.fillText(part, x, y);
    x -= m.widths[i] + m.gap;
  });
  ctx.textAlign = "center";
}

async function image(url: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = coloringCorsUrl(url);
  await img.decode();
  return img;
}

/** Free pages keep their original name/brand pixels; paid pages reuse that exact brand strip. */
export function withColoringFooter(url: string, childName?: string | null, size: ColoringPageSize = "full", signal?: AbortSignal): Promise<string> {
  const result = drawingQueue.then(async () => {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    const dimensions = size === "preview" ? COLORING_PREVIEW_SIZE : COLORING_FULL_SIZE;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    let img: HTMLImageElement | undefined;
    let template: HTMLImageElement | undefined;
    let source: HTMLCanvasElement | undefined;
    try {
    img = await image(url);
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.scale(dimensions.width / 2480, dimensions.height / 3508);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 2480, 3508);
    if (childName) {
      if (size === "full") {
        source = prepareColoringCanvas(img);
      } else {
        // Normalize the small source, never allocate an original-size working canvas for a card.
        source = document.createElement("canvas");
        const sourceFit = fitContain(img.naturalWidth, img.naturalHeight, dimensions.width, dimensions.height);
        source.width = Math.max(1, Math.round(sourceFit.w));
        source.height = Math.max(1, Math.round(sourceFit.h));
        const sourceCtx = source.getContext("2d");
        if (!sourceCtx) throw new Error("Canvas unavailable");
        sourceCtx.fillStyle = "#ffffff";
        sourceCtx.fillRect(0, 0, source.width, source.height);
        sourceCtx.drawImage(img, 0, 0, source.width, source.height);
        const pixels = sourceCtx.getImageData(0, 0, source.width, source.height);
        normalizeColoringPixels(pixels.data, source.width, source.height);
        sourceCtx.putImageData(pixels, 0, 0);
      }
      const fit = fitContain(img.naturalWidth, img.naturalHeight, 2480, 3000);
      ctx.drawImage(source, fit.x, fit.y, fit.w, fit.h);
      ctx.textAlign = "center";
      ctx.direction = "rtl";
      ctx.fillStyle = "#000000";
      ctx.font = "bold 180px Heebo, Arial, sans-serif";
      ctx.fillText(childName, 1240, 3242, 2200);
      template = await image(solPage.url);
      // Copy the unchanged free-page application name: same font, size, color and position.
      ctx.drawImage(template, 0, 3280, 2480, 110, 0, 3280, 2480, 110);
    } else {
      ctx.drawImage(img, 0, 0, 2480, 3508);
    }
    drawCopyrightLine(ctx, childName ? COPYRIGHT_PARTS_PAID : COPYRIGHT_PARTS_FULL);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Coloring image unavailable")), "image/png");
    });
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    return URL.createObjectURL(blob);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      if (source) { source.width = 0; source.height = 0; }
      if (img) img.src = "";
      if (template) template.src = "";
    }
  });
  // A failed/cancelled page must not prevent subsequent jobs; yield to rendering between pages.
  drawingQueue = result.catch(() => {}).then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  return result;
}