// Server-side mirror of src/config/promo.ts. Keep dates in sync.
export const PROMO_END = new Date("2026-08-31T23:59:59+03:00");
export const isPromoActive = (): boolean =>
  Date.now() < PROMO_END.getTime();