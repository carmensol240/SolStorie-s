import { afterEach, describe, expect, it, vi } from "vitest";
import { withColoringFooter } from "@/lib/coloring-footer";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup() {
  const dimensions: number[][] = [];
  const canvases: HTMLCanvasElement[] = [];
  let active = 0;
  let maxActive = 0;
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
  Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    scale: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(), fillText: vi.fn(),
    measureText: () => ({ width: 20 }),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(() => { throw new Error("No base64 allowed"); });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, callback) {
    dimensions.push([this.width, this.height]);
    canvases.push(this);
    active++;
    maxActive = Math.max(maxActive, active);
    setTimeout(() => { active--; callback(new Blob(["png"])); }, 1);
  });
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:page"), revokeObjectURL: vi.fn() }));
  return { dimensions, canvases, maxActive: () => maxActive };
}

describe("coloring page memory", () => {
  it("30 previews use 620×877, compose one at a time and release every canvas", async () => {
    const state = setup();
    await Promise.all(Array.from({ length: 30 }, (_, i) => withColoringFooter(`page-${i}`, null, "preview")));
    expect(state.dimensions).toEqual(Array.from({ length: 30 }, () => [620, 877]));
    expect(state.maxActive()).toBe(1);
    expect(state.canvases.every((c) => c.width === 0 && c.height === 0)).toBe(true);
  });
  it("an explicitly requested full page remains 2480×3508", async () => {
    const state = setup();
    const url = await withColoringFooter("page");
    expect(state.dimensions).toEqual([[2480, 3508]]);
    expect(url).toBe("blob:page");
  });
  it("a cancelled queued preview is not drawn", async () => {
    const state = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(withColoringFooter("page", null, "preview", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(state.dimensions).toEqual([]);
  });
});