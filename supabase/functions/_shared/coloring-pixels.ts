export const COLOR_CHANNEL_DELTA = 40;
export const COLOR_FRACTION_LIMIT = 0.01;
export const LINE_ART_THRESHOLD = 170;

/** RGBA pixels, with transparency composited over white. */
export function coloredPixelFraction(pixels: Uint8Array | Uint8ClampedArray): number {
  let colored = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / 255;
    const r = pixels[i] * alpha + 255 * (1 - alpha);
    const g = pixels[i + 1] * alpha + 255 * (1 - alpha);
    const b = pixels[i + 2] * alpha + 255 * (1 - alpha);
    if (Math.max(r, g, b) - Math.min(r, g, b) > COLOR_CHANNEL_DELTA) colored++;
  }
  return count ? colored / count : 0;
}

export function binarizeColoringPixels(pixels: Uint8Array | Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / 255;
    const average = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 * alpha + 255 * (1 - alpha);
    const value = average < LINE_ART_THRESHOLD ? 0 : 255;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
}