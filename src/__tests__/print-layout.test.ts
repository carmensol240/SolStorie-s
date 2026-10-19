import { describe, it, expect } from "vitest";
import { buildPageSequence, PAGE_MM, PAGE_PX, SAFE_MM, PRINT_TEXTS, printLang, containRect, TEXT_FIT_STEPS } from "@/lib/print-layout";
import { hasPdfEntitlement } from "../../supabase/functions/_shared/pdf-entitlement";

const pages = (pics: boolean[]) => pics.map(p => ({ illustration_url: p ? "x.png" : null }));

describe("print book layout", () => {
  it("is 216 mm (21 cm + 3 mm bleed) at 300 DPI = 2551 px, safe area 13 mm", () => {
    expect(PAGE_MM).toBe(216);
    expect(PAGE_PX).toBe(2551);
    expect(SAFE_MM).toBe(13);
  });
  it("starts with cover, inside cover, dedication", () => {
    const s = buildPageSequence(pages([true]));
    expect(s.slice(0, 3).map(x => x.kind)).toEqual(["cover", "insideCover", "dedication"]);
  });
  it("puts text on even pages with its picture on the next odd page", () => {
    const s = buildPageSequence(pages([true, true, true]));
    s.forEach((slot, i) => {
      if (slot.kind === "text") {
        expect((i + 1) % 2).toBe(0);
        expect(s[i + 1]).toMatchObject({ storyIndex: slot.storyIndex });
      }
    });
  });
  it("a page without a picture joins the previous text page", () => {
    const s = buildPageSequence(pages([true, false, true]));
    expect(s[3]).toEqual({ kind: "text", storyIndex: 0, storyIndexes: [0, 1] });
    expect(s[4]).toEqual({ kind: "illustration", storyIndex: 0 });
    expect(s[5]).toEqual({ kind: "text", storyIndex: 2, storyIndexes: [2] });
  });
  it("7 pages with pictures on 1,3,5,7 → 4 spreads, no decorative pages", () => {
    const s = buildPageSequence(pages([true, false, true, false, true, false, true]));
    expect(s.filter(x => x.kind === "text")).toHaveLength(4);
    expect(s.filter(x => x.kind === "illustration")).toHaveLength(4);
    expect(s.filter(x => x.kind === "decorative")).toHaveLength(0);
    expect(s.length % 4).toBe(0);
    expect(s[s.length - 1].kind).toBe("backCover");
  });
  it("pictures failed on 7 and missing on 8 → exactly one decorative page", () => {
    const s = buildPageSequence(pages([true, false, true, false, true, false, false, false]));
    const deco = s.filter(x => x.kind === "decorative");
    expect(deco).toHaveLength(1);
    expect(s.find(x => x.kind === "text" && x.storyIndex === 6)).toMatchObject({ storyIndexes: [6, 7] });
    expect(s.length % 4).toBe(0);
    expect(s[s.length - 1].kind).toBe("backCover");
  });
  it("never more than two story pages on one text page", () => {
    const s = buildPageSequence(pages([true, false, false, false]));
    s.forEach(x => { if (x.kind === "text") expect(x.storyIndexes.length).toBeLessThanOrEqual(2); });
    expect(s.filter(x => x.kind === "decorative")).toHaveLength(1);
  });
  it("text fit goes 54px→40px, then line-height 1.9→1.6", () => {
    expect(TEXT_FIT_STEPS[0]).toEqual({ font: 54, line: 1.9 });
    expect(TEXT_FIT_STEPS[TEXT_FIT_STEPS.length - 1]).toEqual({ font: 40, line: 1.6 });
    expect(Math.min(...TEXT_FIT_STEPS.map(s => s.font))).toBe(40);
  });
  it("total is a multiple of 4 and back cover is always last", () => {
    for (let n = 1; n <= 16; n++) {
      const s = buildPageSequence(pages(Array(n).fill(true)));
      expect(s.length % 4).toBe(0);
      expect(s[s.length - 1].kind).toBe("backCover");
      expect(s.filter(x => x.kind === "backCover")).toHaveLength(1);
    }
  });
  it("English stories are ltr with English fixed texts", () => {
    expect(printLang("en")).toBe("en");
    expect(PRINT_TEXTS.en.dir).toBe("ltr");
    expect(PRINT_TEXTS.en.theEnd).toBe("The End");
    expect(printLang("he")).toBe("he");
    expect(PRINT_TEXTS.he.dir).toBe("rtl");
  });
  it("a wide 1408x768 picture is never cropped", () => {
    const r = containRect(1408, 768, 2551);
    expect(r.w).toBeCloseTo(2551);
    expect(r.h).toBeLessThan(2551);
  });
});

const fakeClient = (o: { admin?: boolean; sub?: boolean; pkgs?: string[]; unlock?: boolean }) => {
  const q = (result: unknown) => {
    const b: any = { select: () => b, eq: () => b, in: () => b, limit: () => Promise.resolve({ data: result }), maybeSingle: () => Promise.resolve({ data: result }) };
    return b;
  };
  return {
    rpc: () => Promise.resolve({ data: !!o.admin }),
    from: (t: string) =>
      t === "profiles" ? q({ is_subscriber: !!o.sub })
      : t === "purchases" ? q((o.pkgs ?? []).map(package_name => ({ package_name })))
      : q(o.unlock ? { unlock_type: "single" } : null),
  };
};

describe("server print entitlement (upscale)", () => {
  it("refuses a caller with no purchase, subscription or unlock", async () => {
    expect(await hasPdfEntitlement(fakeClient({}), "u", "s")).toBe(false);
  });
  it("refuses a digital-only single story purchase", async () => {
    expect(await hasPdfEntitlement(fakeClient({ pkgs: ["single_story"] }), "u", "s")).toBe(false);
  });
  it("allows admin, subscriber, PDF package or full unlock", async () => {
    expect(await hasPdfEntitlement(fakeClient({ admin: true }), "u", "s")).toBe(true);
    expect(await hasPdfEntitlement(fakeClient({ sub: true }), "u", "s")).toBe(true);
    expect(await hasPdfEntitlement(fakeClient({ pkgs: ["single_story_full"] }), "u", "s")).toBe(true);
    expect(await hasPdfEntitlement(fakeClient({ unlock: true }), "u", "s")).toBe(true);
  });
});
