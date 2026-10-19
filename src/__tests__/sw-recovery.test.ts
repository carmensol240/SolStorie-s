import { describe, it, expect, vi, beforeEach } from "vitest";
import { recoverFromBrokenBuild, isAppShellCache, isBrokenBuildError, RECOVERY_FLAG } from "@/lib/sw-recovery";

describe("sw-recovery", () => {
  let deleted: string[];
  let unregister: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    sessionStorage.clear();
    deleted = [];
    unregister = vi.fn(async () => true);
    (globalThis as any).caches = {
      keys: async () => ["workbox-precache-v2-https://soulstory.co.il/", "html", "app-images", "story-illustrations"],
      delete: async (n: string) => { deleted.push(n); return true; },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations: async () => [{ unregister }] },
    });
    window.history.replaceState({}, "", "/library");
  });

  it("first call unregisters, clears app caches and reloads once", async () => {
    const reload = vi.fn();
    expect(await recoverFromBrokenBuild({ reload })).toBe(true);
    expect(unregister).toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(deleted).toContain("html");
    expect(deleted).not.toContain("story-illustrations");
  });

  it("second call within 10 minutes does nothing (no loop)", async () => {
    const reload = vi.fn();
    await recoverFromBrokenBuild({ reload });
    expect(await recoverFromBrokenBuild({ reload })).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(RECOVERY_FLAG)).toBeTruthy();
  });

  it("never treats offline illustrations as app-shell cache", () => {
    expect(isAppShellCache("story-illustrations")).toBe(false);
    expect(isAppShellCache("workbox-precache-v2-x")).toBe(true);
  });

  it("detects missing-file and undefined-name errors", () => {
    expect(isBrokenBuildError(new ReferenceError("useLocation is not defined"))).toBe(true);
    expect(isBrokenBuildError(new TypeError("Failed to fetch dynamically imported module: x.js"))).toBe(true);
    expect(isBrokenBuildError(new Error("network down"))).toBe(false);
  });
});
