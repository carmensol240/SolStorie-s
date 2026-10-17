import { describe, it, expect } from "vitest";
import { isAmountValidForPackage, PACKAGE_PRICES } from "../../supabase/functions/_shared/package-prices";
import { packageConfig } from "../../supabase/functions/_shared/purchase-credits";

describe("paid amount must match the package price", () => {
  it("1₪ for the popular package does not grant it", () => {
    expect(isAmountValidForPackage("popular", 1)).toBe(false);
  });
  for (const [pkg, price] of Object.entries(PACKAGE_PRICES)) {
    const p = Math.min(...price);
    const low = Math.round((p - 1) * 100) / 100;
    it(`${pkg}: paying below the price (${low}₪) is rejected, full price (${p}₪) is accepted`, () => {
      expect(isAmountValidForPackage(pkg, low)).toBe(false);
      expect(isAmountValidForPackage(pkg, p)).toBe(true);
    });
  }
});

describe("1+1 bonus is gone", () => {
  it("single_story still grants exactly 1 story", () => {
    expect(packageConfig.single_story.stories).toBe(1);
  });
});
