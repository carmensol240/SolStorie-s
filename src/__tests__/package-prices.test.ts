/**
 * Central catalog: the decided prices, one package per amount, the server amount
 * check, and no stray prices anywhere in the site code.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { CATALOG, creditKindForPackage } from "../../supabase/functions/_shared/catalog";
import { PACKAGE_PRICES, isAmountValidForPackage } from "../../supabase/functions/_shared/package-prices";
import { packageIdFromAmount } from "../../supabase/functions/_shared/purchase-credits";

describe("the decided prices", () => {
  it("digital story 39.90, full story 69.90, print file 34.90", () => {
    expect(CATALOG.digital.price).toBe(39.9);
    expect(CATALOG.full.price).toBe(69.9);
    expect(CATALOG.pdf.price).toBe(34.9);
  });

  it("the full story uses the new Grow link", () => {
    expect(CATALOG.full.growUrl).toBe("https://pay.grow.link/MTAxMTMz~cb4021f916e22b79f369e594e6df3c22-NDE0NzM1Mw");
  });

  it("every amount belongs to exactly one package", () => {
    const prices = Object.values(CATALOG).map((p) => p.price);
    expect(new Set(prices).size).toBe(prices.length);
    for (const p of Object.values(CATALOG)) expect(packageIdFromAmount(p.price)).toBe(p.packageId);
  });

  it("the server accepts each package at its catalog price", () => {
    for (const p of Object.values(CATALOG)) {
      expect(PACKAGE_PRICES[p.packageId]).toContain(p.price);
      expect(isAmountValidForPackage(p.packageId, p.price)).toBe(true);
    }
  });

  it("full credits remember they are full; digital ones are digital; print file gives no story credit", () => {
    expect(creditKindForPackage(CATALOG.full.packageId)).toBe("full");
    expect(creditKindForPackage(CATALOG.digital.packageId)).toBe("digital");
    expect(creditKindForPackage(CATALOG.pdf.packageId)).toBe(null);
  });
});

describe("a payment lower than the package price doesn't grant it", () => {
  it("39.90 paid but labelled as full story is refused", () => {
    expect(isAmountValidForPackage("popular", 39.9)).toBe(false);
  });
  it("print file price can't buy a digital story", () => {
    expect(isAmountValidForPackage("single_story", 34.9)).toBe(false);
  });
  it("a real coupon discount is accepted, and only that one", () => {
    expect(isAmountValidForPackage("popular", 55.92, [20])).toBe(true);
    expect(isAmountValidForPackage("popular", 55.92)).toBe(false);
  });
  it("zero, negative and unknown packages are refused", () => {
    expect(isAmountValidForPackage("popular", 0)).toBe(false);
    expect(isAmountValidForPackage("made_up", 39.9)).toBe(false);
  });
});

describe("no price in the site code outside the catalog", () => {
  const allowed = new Set(Object.values(CATALOG).map((p) => p.price.toFixed(2)));
  const files: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) { if (n !== "__tests__") walk(f); }
      else if (/\.(tsx?|jsx?)$/.test(n) && !n.endsWith("types.ts")) files.push(f);
    }
  };
  walk(resolve(__dirname, ".."));

  it("every ₪ amount written in the site matches the catalog", () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      const re = /(?:₪\s*(\d{1,3}\.\d{2}))|(?:(\d{1,3}\.\d{2})\s*₪)/g;
      for (const m of src.matchAll(re)) {
        const v = m[1] ?? m[2];
        if (!allowed.has(v)) bad.push(`${f.split("/src/")[1]}: ${v}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("value packs (3 stories)", () => {
  it("3 full stories cost 179, 3 digital stories cost 99", () => {
    expect(CATALOG.full_pack3.price).toBe(179);
    expect(CATALOG.digital_pack3.price).toBe(99);
  });
  it("each pack gives 3 credits of the right kind", async () => {
    const { packageConfig } = await import("../../supabase/functions/_shared/purchase-credits");
    expect(packageConfig.full_pack3.stories).toBe(3);
    expect(packageConfig.digital_pack3.stories).toBe(3);
    expect(creditKindForPackage("full_pack3")).toBe("full");
    expect(creditKindForPackage("digital_pack3")).toBe("digital");
  });
  it("amount matching is exact: 99 and 99.90 are different packages", () => {
    expect(isAmountValidForPackage("digital_pack3", 99)).toBe(true);
    expect(isAmountValidForPackage("digital_pack3", 99.9)).toBe(false);
    expect(isAmountValidForPackage("digital_pack3", 99.05)).toBe(false);
    expect(isAmountValidForPackage("popular", 99)).toBe(false);
    expect(isAmountValidForPackage("full_pack3", 178.9)).toBe(false);
    expect(packageIdFromAmount(99)).toBe("digital_pack3");
    expect(packageIdFromAmount(179)).toBe("full_pack3");
  });
});

describe("value pack Grow links", () => {
  it("each pack has its own Grow link", () => {
    expect(CATALOG.full_pack3.growUrl).toBe("https://pay.grow.link/MTAxMTMz~4c066b17a38c2c7d52af981039a3559e-NDE1MTAzMQ");
    expect(CATALOG.digital_pack3.growUrl).toBe("https://pay.grow.link/MTAxMTMz~3fc959a3cdda1aa50d81ff0a7b40350d-NDE1MTA0Mw");
  });
});
