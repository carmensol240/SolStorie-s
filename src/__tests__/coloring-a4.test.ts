import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { fitContain, coloringPdfFileName, printColoringA4, prepareColoringCanvas } from "@/lib/coloring-a4";

const makeContext = () => ({
  fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) })),
  putImageData: vi.fn(),
});

describe("empty exports versus painted artwork", () => {
  afterEach(() => vi.restoreAllMocks());
  it("removes color from an empty page", () => {
    const ctx = makeContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    prepareColoringCanvas(new Image());
    expect([...ctx.putImageData.mock.calls[0][0].data]).toEqual([0, 0, 0, 255]);
  });
  it("does not binarize a child's painted artwork", () => {
    const ctx = makeContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    prepareColoringCanvas(new Image(), { preserveColors: true });
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    expect(ctx.getImageData).not.toHaveBeenCalled();
    expect(ctx.putImageData).not.toHaveBeenCalled();
  });
});

describe("A4 coloring", () => {
  it("fits a 2:3 image inside 190x277mm without cropping", () => {
    const f = fitContain(1000, 1500, 190, 277);
    expect(f.w).toBeLessThanOrEqual(190);
    expect(f.h).toBeLessThanOrEqual(277);
    expect(f.h).toBeCloseTo(277);
  });
  it("names the file <name>-coloring-page-A4.pdf", () => {
    expect(coloringPdfFileName("נועה")).toBe("נועה-coloring-page-A4.pdf");
  });
});

describe("coloring print marker", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(makeContext() as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AAAA");
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  const start = () => {
    vi.useFakeTimers();
    window.print = vi.fn();
    const desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
    Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
    printColoringA4("data:image/png;base64,AAAA");
    if (desc) Object.defineProperty(HTMLImageElement.prototype, "complete", desc);
    expect(document.body.classList.contains("printing-coloring-page")).toBe(true);
  };

  it("focus within the first second does not clear the marker", () => {
    start();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event("focus"));
    expect(document.body.classList.contains("printing-coloring-page")).toBe(true);
    window.dispatchEvent(new Event("afterprint"));
  });

  it("afterprint removes the marker and print root", () => {
    start();
    window.dispatchEvent(new Event("afterprint"));
    expect(document.body.classList.contains("printing-coloring-page")).toBe(false);
    expect(document.getElementById("a4-print-root")).toBeNull();
  });

  it("cancelled print: focus after the delay removes the marker", () => {
    start();
    vi.advanceTimersByTime(1600);
    window.dispatchEvent(new Event("focus"));
    expect(document.body.classList.contains("printing-coloring-page")).toBe(false);
  });

  it("no signal at all: removed after 60 seconds", () => {
    start();
    vi.advanceTimersByTime(60000);
    expect(document.body.classList.contains("printing-coloring-page")).toBe(false);
  });
});
