// A4 print + PDF helpers for coloring pages (210 x 297 mm portrait).
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

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  return img;
}

export async function downloadColoringPdfA4(url: string, name?: string | null) {
  const img = await loadImage(url);
  // Render the printable area (190 x 277 mm) at 300 dpi on white.
  const areaW = A4_MM.w - A4_MM.margin * 2;
  const areaH = A4_MM.h - A4_MM.margin * 2;
  const pxPerMm = A4_PX.w / A4_MM.w;
  const cw = Math.round(areaW * pxPerMm);
  const ch = Math.round(areaH * pxPerMm);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const f = fitContain(img.naturalWidth, img.naturalHeight, cw, ch);
  ctx.drawImage(img, f.x, f.y, f.w, f.h);
  const data = canvas.toDataURL("image/jpeg", 0.95);

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.addImage(data, "JPEG", A4_MM.margin, A4_MM.margin, areaW, areaH);
  pdf.save(coloringPdfFileName(name));
}

/** Print only the coloring page on one A4 sheet. */
export function printColoringA4(url: string) {
  const existing = document.getElementById("a4-print-root");
  existing?.remove();
  const root = document.createElement("div");
  root.id = "a4-print-root";
  const img = document.createElement("img");
  img.src = url;
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
    img.onerror = go;
  }
  return cleanup;
}

export const PRINT_FOCUS_DELAY_MS = 1500;
export const PRINT_FALLBACK_MS = 60000;
