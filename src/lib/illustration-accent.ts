/**
 * Pick a decoration color from an illustration's pixels: the average of the
 * reasonably saturated mid-tone pixels, darkened so it stays visible on the
 * light paper. Returns null when the picture has no usable color.
 */
export function accentFromPixels(data: ArrayLike<number>): string | null {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    const max = Math.max(R, G, B), min = Math.min(R, G, B);
    const light = (max + min) / 2;
    if (max - min < 40 || light < 50 || light > 215) continue;
    r += R; g += G; b += B; n++;
  }
  if (!n) return null;
  r /= n; g /= n; b /= n;
  const max = Math.max(r, g, b);
  // Scale so the brightest channel lands near 170 (mid-dark, readable on paper).
  const k = max > 0 ? 170 / max : 1;
  const c = (v: number) => Math.round(Math.min(255, v * k));
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
}
