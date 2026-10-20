// A4 print + PDF helpers for coloring pages (210 x 297 mm portrait).
import { binarizeColoringPixels, normalizeColoringPixels } from "../../supabase/functions/_shared/coloring-pixels";

export interface ColoringExportOptions { preserveColors?: boolean }
export const A4_MM = { w: 210, h: 297, margin: 10 };
export const A4_PX = { w: 2480, h: 3508 }; // 300 dpi

/** Fit an image of (iw, ih) inside a box (bw, bh), keeping proportions, centered. */
export function fitContain(iw: number, ih: number, bw: number, bh: number) {
  const scale = Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { w, h, x: (bw - w) / 2, y: (bh - h) / 2 };
}

export function coloringPdfFileName(name?: string | null) {
  const clean = (name || "coloring").replace(/[\\/:*?"<>|]+/g, "").trim() || "coloring";
  return `${clean}-coloring-page-A4.pdf`;
}

/** Separate cache key for crossOrigin loads: the plain <img> in the library caches the
 *  same URL without CORS headers, and reusing that entry fails the canvas load. */
export function coloringCorsUrl(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + "cors=1";
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = coloringCorsUrl(url);
  await img.decode();
  return img;
}

export function prepareColoringCanvas(img: HTMLImageElement, options: ColoringExportOptions = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  if (!options.preserveColors) {
    // Clean page: threshold only. Color or wide dark areas: thin lines + white fills, never black blobs.
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    normalizeColoringPixels(pixels.data, canvas.width, canvas.height);
    ctx.putImageData(pixels, 0, 0);
  }
  return canvas;
}

export async function downloadColoringPdfA4(url: string, name?: string | null, options: ColoringExportOptions = {}) {
  const img = await loadImage(url);
  const source = prepareColoringCanvas(img, options);
  // Render the printable area (190 x 277 mm) at 300 dpi on white.
  const areaW = A4_MM.w - A4_MM.margin * 2;
  const areaH = A4_MM.h - A4_MM.margin * 2;
  const pxPerMm = A4_PX.w / A4_MM.w;
  const cw = Math.round(areaW * pxPerMm);
  const ch = Math.round(areaH * pxPerMm);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const f = fitContain(img.naturalWidth, img.naturalHeight, cw, ch);
  ctx.drawImage(source, f.x, f.y, f.w, f.h);
  if (!options.preserveColors) {
    // Source is already line art here; this only removes scaling gray at line edges.
    const pixels = ctx.getImageData(0, 0, cw, ch);
    binarizeColoringPixels(pixels.data);
    ctx.putImageData(pixels, 0, 0);
  }
  const data = canvas.toDataURL("image/png");

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.addImage(data, "PNG", A4_MM.margin, A4_MM.margin, areaW, areaH);
  const fileName = coloringPdfFileName(name);
  // Phones: share the A4 PDF itself (never the bare image) when the share sheet supports files.
  if (await shareA4Pdf(pdf.output("blob"), fileName)) return;
  pdf.save(fileName);
}

/** Returns true when the PDF was handed to the share sheet (or the user cancelled it). */
export async function shareA4Pdf(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share || typeof File === "undefined") return false;
  const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  if (!touch) return false;
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: fileName });
    return true;
  } catch (e) {
    return (e as Error)?.name === "AbortError";
  }
}

export const A4_PRINT_HINT = "להדפסה בגודל מלא: בחרו A4 וגודל אמיתי (100%)";

/** Print only the coloring page on one A4 sheet. */
export function printColoringA4(url: string, options: ColoringExportOptions = {}) {
  const existing = document.getElementById("a4-print-root");
  existing?.remove();
  const root = document.createElement("div");
  root.id = "a4-print-root";
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  img.src = coloringCorsUrl(url);
  img.alt = "coloring page";
  root.appendChild(img);
  document.body.appendChild(root);
  // A4 page size only for this print (an @page rule can't be scoped by class).
  document.getElementById("a4-print-page-style")?.remove();
  const pageStyle = document.createElement("style");
  pageStyle.id = "a4-print-page-style";
  pageStyle.textContent = "@media print { @page { size: A4 portrait; margin: 10mm; } }";
  document.head.appendChild(pageStyle);
  document.body.classList.add("printing-coloring-page");
  let done = false;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    if (done) return;
    done = true;
    document.body.classList.remove("printing-coloring-page");
    pageStyle.remove();
    root.remove();
    window.removeEventListener("afterprint", cleanup);
    window.removeEventListener("focus", cleanup);
    if (focusTimer) clearTimeout(focusTimer);
    if (fallbackTimer) clearTimeout(fallbackTimer);
  };
  window.addEventListener("afterprint", cleanup);
  const go = () => {
    if (done) return;
    try {
      const source = prepareColoringCanvas(img, options);
      const printable = document.createElement("img");
      printable.alt = img.alt;
      printable.onload = launchPrint;
      printable.onerror = cleanup;
      printable.src = source.toDataURL("image/png");
      root.replaceChildren(printable);
      if (printable.complete) launchPrint();
    } catch (error) {
      cleanup();
      console.error("Coloring print preparation failed", error);
    }
  };
  let launched = false;
  const launchPrint = () => {
    if (done || launched) return;
    launched = true;
    window.print();
    // Non-blocking print (iPhone etc.): only listen for focus after a delay,
    // so the marker can't be cleared before the page is actually printed.
    focusTimer = setTimeout(() => {
      if (!done) window.addEventListener("focus", cleanup, { once: true });
    }, PRINT_FOCUS_DELAY_MS);
    fallbackTimer = setTimeout(cleanup, PRINT_FALLBACK_MS);
  };
  if (img.complete) go();
  else {
    img.onload = go;
    img.onerror = cleanup;
  }
  return cleanup;
}

export const PRINT_FOCUS_DELAY_MS = 1500;
export const PRINT_FALLBACK_MS = 60000;
