// Promo end: 31/8/2026 23:59 Israel time (UTC+3).
// After this moment: countdown hidden, launch prices revert to originalPrice,
// and the 1+1 first-purchase bonus is disabled everywhere in the UI.
export const PROMO_END = new Date("2026-08-31T23:59:59+03:00");
export const PROMO_END_LABEL = "31/8";
export const isPromoActive = (now: Date = new Date()): boolean =>
  now.getTime() < PROMO_END.getTime();