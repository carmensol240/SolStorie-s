// Prices come only from the central catalog (supabase/functions/_shared/catalog.ts).
import { CATALOG, type ProductKey } from "../../supabase/functions/_shared/catalog";

export { CATALOG };
export type { ProductKey };

// The launch promotion ended 30/9/2026. Kept so old imports compile; always false now.
export const PROMO_END = new Date("2026-09-30T23:59:59+03:00");
export const PROMO_END_LABEL = "ה-30/9";
export const isPromoActive = (now: Date = new Date()): boolean => now.getTime() < PROMO_END.getTime() && false;

/** Price keys used across the site, mapped to catalog products. */
export type PriceKey = ProductKey;

export const getPrice = (key: PriceKey): number => CATALOG[key].price;
export const getRegularPrice = getPrice;
export const formatPrice = (key: PriceKey): string => CATALOG[key].price.toFixed(2);
