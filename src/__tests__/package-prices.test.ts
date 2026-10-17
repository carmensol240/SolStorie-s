/**
 * The Grow webhook only grants the package named in cField2 when the amount
 * paid matches that package's price. These tests guard that rule and keep the
 * server price list in sync with the prices shown in the UI.
 */
import { describe, it, expect } from "vitest";
import {
  PACKAGE_PRICES,
  isAmountValidForPackage,
} from "../../supabase/functions/_shared/package-prices";
import { getPrice, getRegularPrice, PROMO_END, type PriceKey } from "@/config/promo";

const UI_PRICE_TO_PACKAGE: Record<PriceKey, string> = {
  basic: "single_story_digital",
  popular: "popular",
  pdf: "pdf",
  gift_two_stories: "gift_two_stories",
  single_story: "single_story",
};

describe("isAmountValidForPackage", () => {
  it("accepts the real price of a package", () => {
    expect(isAmountValidForPackage("popular", 119.9)).toBe(true);
    expect(isAmountValidForPackage("coloring_single", 9.9)).toBe(true);
  });

  it("rejects a cheap payment relabelled as an expensive package", () => {
    expect(isAmountValidForPackage("popular", 39.9)).toBe(false);
    expect(isAmountValidForPackage("pdf", 9.9)).toBe(false);
  });

  it("rejects unknown packages, zero and negative amounts", () => {
    expect(isAmountValidForPackage("made_up_package", 39.9)).toBe(false);
    expect(isAmountValidForPackage("popular", 0)).toBe(false);
    expect(isAmountValidForPackage("popular", -119.9)).toBe(false);
  });

  it("accepts a price reduced by an active discount coupon, and only that", () => {
    // 119.90 - 20% = 95.92
    expect(isAmountValidForPackage("popular", 95.92)).toBe(false);
    expect(isAmountValidForPackage("popular", 95.92, [20])).toBe(true);
    expect(isAmountValidForPackage("popular", 95.92, [10])).toBe(false);
  });

  it("tolerates Grow rounding of a few agorot", () => {
    expect(isAmountValidForPackage("popular", 95.9, [20])).toBe(true);
  });
});

describe("server price list matches the UI prices", () => {
  const promoDay = new Date(PROMO_END.getTime() - 24 * 3600 * 1000);
  for (const [key, packageId] of Object.entries(UI_PRICE_TO_PACKAGE) as [PriceKey, string][]) {
    it(`${key}: promo and regular prices are accepted for ${packageId}`, () => {
      expect(PACKAGE_PRICES[packageId]).toBeDefined();
      expect(isAmountValidForPackage(packageId, getPrice(key, promoDay))).toBe(true);
      expect(isAmountValidForPackage(packageId, getRegularPrice(key))).toBe(true);
    });
  }
});
