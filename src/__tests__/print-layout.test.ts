import { describe, it, expect } from "vitest";
import { buildPageSequence, PAGE_MM, PAGE_PX, SAFE_MM, PRINT_TEXTS, printLang, containRect } from "@/lib/print-layout";
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
  it("a missing picture becomes a decorative page and nothing shifts", () => {
    const s = buildPageSequence(pages([true, false, true]));
    expect(s[5]).toEqual({ kind: "decorative", storyIndex: 1 });
    expect(s[6]).toEqual({ kind: "text", storyIndex: 2 });
    expect(s[7]).toEqual({ kind: "illustration", storyIndex: 2 });
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
