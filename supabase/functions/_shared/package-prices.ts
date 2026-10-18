// Every price (₪) a package can legitimately be paid at. The Grow webhook only
// grants the package named in cField2 when the amount actually paid matches
// one of these prices (or one of them minus an active discount coupon).
// cField2 comes from the checkout URL, which the buyer can edit, so it must
// never be trusted on its own.
//
// Current packages read their price from the central catalog (catalog.ts).
// Retired packages keep their old prices only so payments already made via
// old links are still honored.
import { CATALOG } from "./catalog.ts";

export const PACKAGE_PRICES: Record<string, number[]> = {
  [CATALOG.digital.packageId]: [CATALOG.digital.price],
  [CATALOG.full.packageId]: [CATALOG.full.price, 99.9, 119.9, 129.9],
  [CATALOG.pdf.packageId]: [CATALOG.pdf.price, 59.9, 69.9],
  // Retired
  single_story_digital: [29.9, 39.9, 49.9],
  basic: [29.9, 39.9, 49.9],
  gift_single_digital: [29.9, 39.9, 49.9],
  single_story_full: [69.9, 99.9, 119.9, 129.9],
  gift_single_full: [69.9, 99.9, 119.9, 129.9],
  coloring_single: [9.9],
  coloring_bundle: [24.9],
  coloring_story: [24.9],
  gift_two_stories: [59.9, 69.9, 89.9],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * True when `amount` is a legitimate price for `packageId`: one of its known
 * prices, or one of them reduced by one of `discountPercents` (active
 * discount coupons). A 0.05 ₪ tolerance covers Grow's rounding.
 */
export function isAmountValidForPackage(
  packageId: string,
  amount: number,
  discountPercents: number[] = [],
): boolean {
  const prices = PACKAGE_PRICES[packageId];
  if (!prices || !Number.isFinite(amount) || amount <= 0) return false;
  const paid = round2(amount);
  for (const price of prices) {
    if (Math.abs(paid - price) <= 0.05) return true;
    for (const d of discountPercents) {
      if (!Number.isFinite(d) || d <= 0 || d >= 100) continue;
      if (Math.abs(paid - round2(price * (1 - d / 100))) <= 0.05) return true;
    }
  }
  return false;
}
