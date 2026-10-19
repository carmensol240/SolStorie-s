import { describe, it, expect } from "vitest";
import {
  coloredPixelFraction, COLOR_FRACTION_LIMIT, inspectColoringPixels, toLineArt,
  normalizeColoringPixels, extractOutlines,
} from "../../supabase/functions/_shared/coloring-pixels";

const W = 200, H = 200;
const white = () => new Uint8ClampedArray(W * H * 4).fill(255);
const paint = (px: Uint8ClampedArray, x0: number, y0: number, x1: number, y1: number, rgb: number[]) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px.set([...rgb, 255], (y * W + x) * 4);
};
const blackShare = (px: Uint8ClampedArray) => {
  let b = 0; for (let i = 0; i < px.length; i += 4) if (px[i] === 0) b++; return b / (px.length / 4);
};

describe("check (a): colored pixels", () => {
  it("counts only channel differences greater than 40", () => {
    expect(coloredPixelFraction(new Uint8Array([80, 120, 100, 255, 80, 121, 100, 255]))).toBe(0.5);
  });
  it("fails only above one percent", () => {
    const pixels = new Uint8Array(100 * 4).fill(255);
    pixels.set([255, 0, 0, 255], 0);
    expect(coloredPixelFraction(pixels) > COLOR_FRACTION_LIMIT).toBe(false);
    pixels.set([255, 0, 0, 255], 4);
    expect(coloredPixelFraction(pixels) > COLOR_FRACTION_LIMIT).toBe(true);
  });
});

describe("check (b): solid black", () => {
  it("thin outlines pass", () => {
    const px = white();
    paint(px, 20, 20, 180, 22, [0, 0, 0]); paint(px, 20, 178, 180, 180, [0, 0, 0]);
    paint(px, 20, 20, 22, 180, [0, 0, 0]); paint(px, 178, 20, 180, 180, [0, 0, 0]);
    expect(inspectColoringPixels(px, W, H).clean).toBe(true);
  });
  it("many thin lines pass (normal pages are 9-21% black)", () => {
    const px = white();
    for (let x = 0; x < W; x += 6) paint(px, x, 0, x + 1, H, [0, 0, 0]); // thin lines, ~17%
    const r = inspectColoringPixels(px, W, H);
    expect(r.blackFraction).toBeGreaterThan(0.08);
    expect(r.largestBlackBlob).toBeLessThanOrEqual(0.02);
    expect(r.clean).toBe(true);
  });
  it("one solid black patch larger than 2% fails", () => {
    const px = white();
    paint(px, 50, 50, 85, 85, [0, 0, 0]); // ~3%
    const r = inspectColoringPixels(px, W, H);
    expect(r.blackFraction).toBeLessThan(0.08);
    expect(r.largestBlackBlob).toBeGreaterThan(0.02);
    expect(r.clean).toBe(false);
  });
  it("dark gray fill counts as black", () => {
    const px = white();
    paint(px, 50, 50, 85, 85, [150, 150, 150]);
    expect(inspectColoringPixels(px, W, H).clean).toBe(false);
  });
});

describe("thin-line conversion", () => {
  it("a dark green field becomes white with an outline, no black blob", () => {
    const px = white();
    paint(px, 0, 120, W, H, [30, 110, 40]);
    toLineArt(px, W, H);
    expect(px[(160 * W + 100) * 4]).toBe(255);
    expect(px[(120 * W + 100) * 4]).toBe(0);
    expect(inspectColoringPixels(px, W, H).clean).toBe(true);
  });
  it("a solid black hair shape becomes an outline, thin lines stay", () => {
    const px = white();
    paint(px, 60, 60, 120, 120, [10, 10, 10]);
    paint(px, 10, 10, 190, 12, [0, 0, 0]);
    toLineArt(px, W, H);
    expect(px[(90 * W + 90) * 4]).toBe(255);
    expect(px[(60 * W + 90) * 4]).toBe(0);
    expect(px[(11 * W + 100) * 4]).toBe(0);
    expect(inspectColoringPixels(px, W, H).clean).toBe(true);
  });
  it("a clean page is only thresholded", () => {
    const px = white();
    paint(px, 10, 10, 190, 12, [40, 40, 40]);
    paint(px, 10, 50, 190, 52, [200, 200, 200]);
    expect(normalizeColoringPixels(px, W, H).clean).toBe(true);
    expect([...px.slice((11 * W + 50) * 4, (11 * W + 50) * 4 + 4)]).toEqual([0, 0, 0, 255]);
    expect(px[(51 * W + 50) * 4]).toBe(255);
  });
  it("transparent pixels count as white", () => {
    const px = new Uint8ClampedArray([255, 0, 0, 0]);
    expect(coloredPixelFraction(px)).toBe(0);
    normalizeColoringPixels(px, 1, 1);
    expect([...px]).toEqual([255, 255, 255, 255]);
  });
});

describe("edge-detection fallback", () => {
  it("draws the outline of a colored shape, not a fill", () => {
    const px = white();
    paint(px, 0, 0, W, H, [120, 180, 230]);
    paint(px, 60, 60, 140, 140, [230, 200, 40]);
    extractOutlines(px, W, H);
    expect(px[(100 * W + 100) * 4]).toBe(255);
    expect(px[(60 * W + 100) * 4]).toBe(0);
    expect(blackShare(px)).toBeLessThanOrEqual(0.08);
    expect(inspectColoringPixels(px, W, H).clean).toBe(true);
  });
});
