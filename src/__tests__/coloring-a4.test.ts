import { describe, it, expect } from "vitest";
import { fitContain, coloringPdfFileName } from "@/lib/coloring-a4";

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
