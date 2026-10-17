import { describe, it, expect, vi, afterEach } from "vitest";
import { fitContain, coloringPdfFileName, printColoringA4 } from "@/lib/coloring-a4";

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
  afterEach(() => vi.useRealTimers());

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
