import { describe, it, expect } from "vitest";
import { binarizeColoringPixels, coloredPixelFraction, COLOR_FRACTION_LIMIT } from "../../supabase/functions/_shared/coloring-pixels";

describe("empty coloring pixel rules", () => {
  it("counts only channel differences greater than 40", () => {
    expect(coloredPixelFraction(new Uint8Array([80, 120, 100, 255, 80, 121, 100, 255]))).toBe(0.5);
  });
  it("retries only above one percent", () => {
    const pixels = new Uint8Array(100 * 4).fill(255);
    pixels.set([255, 0, 0, 255], 0);
    expect(coloredPixelFraction(pixels) > COLOR_FRACTION_LIMIT).toBe(false);
    pixels.set([255, 0, 0, 255], 4);
    expect(coloredPixelFraction(pixels) > COLOR_FRACTION_LIMIT).toBe(true);
  });
  it("maps averages below 170 to black, 170 and above to white", () => {
    const pixels = new Uint8Array([169, 169, 169, 255, 170, 170, 170, 255, 255, 0, 0, 255]);
    binarizeColoringPixels(pixels);
    expect([...pixels]).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
  });
  it("composites transparent pixels over white", () => {
    const pixels = new Uint8Array([255, 0, 0, 0]);
    expect(coloredPixelFraction(pixels)).toBe(0);
    binarizeColoringPixels(pixels);
    expect([...pixels]).toEqual([255, 255, 255, 255]);
  });
});