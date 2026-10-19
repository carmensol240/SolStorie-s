import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Renders the whole app so a missing import (e.g. "useLocation is not defined")
// in any always-mounted component fails the test suite instead of production.
describe("App smoke render", () => {
  it("renders the full app without throwing", async () => {
    window.matchMedia ||= ((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    })) as any;
    (globalThis as any).IntersectionObserver ||= class { observe() {} unobserve() {} disconnect() {} };
    (globalThis as any).ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
    window.scrollTo = vi.fn() as any;
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as any;
    HTMLMediaElement.prototype.pause = vi.fn() as any;
    const errors: unknown[] = [];
    const onErr = (e: ErrorEvent) => errors.push(e.error);
    window.addEventListener("error", onErr);
    const { default: App } = await import("@/App");
    const { container } = render(<App />);
    await new Promise((r) => setTimeout(r, 300));
    window.removeEventListener("error", onErr);
    expect(errors.filter((e) => e instanceof ReferenceError)).toEqual([]);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  }, 30000);
});
