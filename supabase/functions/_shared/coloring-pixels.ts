// Pure pixel rules for empty coloring pages (shared by the browser and server functions).
// A coloring page = thin black outlines on white: no color, no gray, no solid black areas.

export const COLOR_CHANNEL_DELTA = 40;
export const COLOR_FRACTION_LIMIT = 0.01;
export const LINE_ART_THRESHOLD = 170;
export const BLACK_BLOB_LIMIT = 0.02;

type Pixels = Uint8Array | Uint8ClampedArray;

function channel(pixels: Pixels, i: number, c: number) {
  const alpha = pixels[i + 3] / 255;
  return pixels[i + c] * alpha + 255 * (1 - alpha);
}

function isColored(pixels: Pixels, i: number) {
  const r = channel(pixels, i, 0), g = channel(pixels, i, 1), b = channel(pixels, i, 2);
  return Math.max(r, g, b) - Math.min(r, g, b) > COLOR_CHANNEL_DELTA;
}

function isDark(pixels: Pixels, i: number) {
  return (channel(pixels, i, 0) + channel(pixels, i, 1) + channel(pixels, i, 2)) / 3 < LINE_ART_THRESHOLD;
}

/** RGBA pixels, with transparency composited over white. */
export function coloredPixelFraction(pixels: Pixels): number {
  let colored = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) if (isColored(pixels, i)) colored++;
  return count ? colored / count : 0;
}

/** Plain threshold. Only safe on a page that already passed inspectColoringPixels. */
export function binarizeColoringPixels(pixels: Pixels): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const value = isDark(pixels, i) ? 0 : 255;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
}

/** Any dark mark wider than about 2*radius+1 px counts as a filled area, not a line. */
export function solidRadius(w: number, h: number) {
  return Math.max(2, Math.round(Math.min(w, h) / 250));
}

function integral(mask: Uint8Array, w: number, h: number) {
  const sat = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += mask[y * w + x];
      sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1] + row;
    }
  }
  return sat;
}

function morph(mask: Uint8Array, w: number, h: number, r: number, mode: "erode" | "dilate") {
  const sat = integral(mask, w, h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const sum = sat[y1 * (w + 1) + x1] - sat[y0 * (w + 1) + x1] - sat[y1 * (w + 1) + x0] + sat[y0 * (w + 1) + x0];
      out[y * w + x] = mode === "erode" ? (sum === (x1 - x0) * (y1 - y0) ? 1 : 0) : (sum > 0 ? 1 : 0);
    }
  }
  return out;
}

/** Filled areas only: thin lines disappear, wide dark regions keep their full shape. */
export function solidAreas(mask: Uint8Array, w: number, h: number, r = solidRadius(w, h)) {
  return morph(morph(mask, w, h, r, "erode"), w, h, r, "dilate");
}

/** Visits every 4-connected region (onRegion gets its pixels) and returns the largest size. */
function components(mask: Uint8Array, w: number, h: number, onRegion?: (pixels: Int32Array, size: number) => void) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const region = new Int32Array(w * h);
  let largest = 0;
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue;
    let top = 0, size = 0;
    stack[top++] = start;
    seen[start] = 1;
    while (top) {
      const p = stack[--top];
      region[size++] = p;
      const x = p % w;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack[top++] = p - 1; }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack[top++] = p + 1; }
      if (p >= w && mask[p - w] && !seen[p - w]) { seen[p - w] = 1; stack[top++] = p - w; }
      if (p + w < w * h && mask[p + w] && !seen[p + w]) { seen[p + w] = 1; stack[top++] = p + w; }
    }
    if (size > largest) largest = size;
    onRegion?.(region, size);
  }
  return largest;
}

export interface ColoringInspection {
  coloredFraction: number;
  blackFraction: number;
  largestBlackBlob: number;
  clean: boolean;
}

/** Both checks: (a) colored pixels above 1%, (b) a solid black area above 2%. blackFraction is reported only. */
export function inspectColoringPixels(pixels: Pixels, w: number, h: number): ColoringInspection {
  const n = w * h;
  const dark = new Uint8Array(n);
  let colored = 0, black = 0;
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (isColored(pixels, i)) colored++;
    if (isDark(pixels, i)) { dark[p] = 1; black++; }
  }
  const largest = n ? components(solidAreas(dark, w, h), w, h) : 0;
  const coloredFraction = n ? colored / n : 0;
  const blackFraction = n ? black / n : 0;
  const largestBlackBlob = n ? largest / n : 0;
  return {
    coloredFraction, blackFraction, largestBlackBlob,
    clean: coloredFraction <= COLOR_FRACTION_LIMIT && largestBlackBlob <= BLACK_BLOB_LIMIT,
  };
}

/**
 * Keeps only thin dark lines. Colored areas and wide dark areas become white
 * with a thin black outline around them (and between different colors).
 */
export function toLineArt(pixels: Pixels, w: number, h: number): void {
  const n = w * h;
  const colored = new Uint8Array(n);
  const ink = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (isColored(pixels, i)) colored[p] = 1;
    else if (isDark(pixels, i)) ink[p] = 1;
  }
  const solid = solidAreas(ink, w, h);
  const t = Math.max(1, Math.round(Math.min(w, h) / 700));
  const out = new Uint8Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (ink[p] && !solid[p]) { out[p] = 1; continue; }
      const fill = colored[p] || solid[p];
      if (!fill) continue;
      for (let k = 0; k < 4; k++) {
        const q = k === 0 ? (x >= t ? p - t : -1) : k === 1 ? (x < w - t ? p + t : -1) : k === 2 ? (y >= t ? p - t * w : -1) : (y < h - t ? p + t * w : -1);
        if (q < 0) continue;
        if (!(colored[q] || solid[q])) { out[p] = 1; break; }
        if (colored[p] && colored[q]) {
          const i = p * 4, j = q * 4;
          const diff = Math.max(Math.abs(pixels[i] - pixels[j]), Math.abs(pixels[i + 1] - pixels[j + 1]), Math.abs(pixels[i + 2] - pixels[j + 2]));
          if (diff > 60) { out[p] = 1; break; }
        }
      }
    }
  }
  writeMask(pixels, out);
}

function writeMask(pixels: Pixels, mask: Uint8Array) {
  for (let p = 0; p < mask.length; p++) {
    const i = p * 4;
    const v = mask[p] ? 0 : 255;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
    pixels[i + 3] = 255;
  }
}

/** Clean page: plain threshold is safe. Otherwise: thin-line conversion. */
export function normalizeColoringPixels(pixels: Pixels, w: number, h: number): ColoringInspection {
  const report = inspectColoringPixels(pixels, w, h);
  if (report.clean) binarizeColoringPixels(pixels);
  else toLineArt(pixels, w, h);
  return report;
}

function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0, c = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) { s += src[y * w + k]; c++; }
      tmp[y * w + x] = s / c;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let s = 0, c = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) { s += tmp[k * w + x]; c++; }
      out[y * w + x] = s / c;
    }
  }
  return out;
}

/**
 * Outline extraction (edge detection) from a full-color illustration.
 * Produces black outlines on white; used only when the AI pages keep failing.
 */
export function extractOutlines(pixels: Pixels, w: number, h: number, targetFraction = 0.06): void {
  const n = w * h;
  const b = Math.max(1, Math.round(Math.min(w, h) / 400));
  const chans = [0, 1, 2].map((c) => {
    const a = new Float32Array(n);
    for (let p = 0; p < n; p++) a[p] = channel(pixels, p * 4, c);
    return boxBlur(boxBlur(a, w, h, b), w, h, b);
  });
  const mag = new Float32Array(n);
  const horizontal = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      let m = 0;
      for (const a of chans) {
        const gx = a[p - w + 1] + 2 * a[p + 1] + a[p + w + 1] - a[p - w - 1] - 2 * a[p - 1] - a[p + w - 1];
        const gy = a[p + w - 1] + 2 * a[p + w] + a[p + w + 1] - a[p - w - 1] - 2 * a[p - w] - a[p - w + 1];
        const v = Math.abs(gx) + Math.abs(gy);
        if (v > m) { m = v; horizontal[p] = Math.abs(gx) >= Math.abs(gy) ? 1 : 0; }
      }
      mag[p] = m;
    }
  }
  // Thin every edge to one pixel (keep only the local maximum across the edge).
  const ridge = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const step = horizontal[p] ? 1 : w;
      if (mag[p] >= mag[p - step] && mag[p] > mag[p + step]) ridge[p] = mag[p];
    }
  }
  const thickness = Math.max(1, Math.round(Math.min(w, h) / 500));
  const hist = new Int32Array(2049);
  for (let p = 0; p < n; p++) if (ridge[p] > 0) hist[Math.min(2048, Math.round(ridge[p]))]++;
  const budget = (n * targetFraction) / (2 * thickness + 1);
  let threshold = 2048, above = 0;
  while (threshold > 0 && above + hist[threshold] <= budget) above += hist[threshold--];
  threshold = Math.max(60, threshold + 1);
  let edges = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (ridge[p] >= threshold) edges[p] = 1;
  // Drop specks and texture: keep only connected lines of a meaningful length.
  const minSize = Math.max(12, Math.round(Math.min(w, h) * 0.02));
  const linked = morph(edges, w, h, 1, "dilate");
  const keep = new Uint8Array(n);
  components(linked, w, h, (region, size) => {
    if (size >= minSize * 3) for (let k = 0; k < size; k++) keep[region[k]] = 1;
  });
  for (let p = 0; p < n; p++) edges[p] = edges[p] && keep[p] ? 1 : 0;
  edges = morph(edges, w, h, thickness, "dilate");
  writeMask(pixels, edges);
}
