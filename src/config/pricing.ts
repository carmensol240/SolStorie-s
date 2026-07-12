// Legacy package definitions (PRICING_PACKAGES, EDIT_KIT_PACKAGE,
// COLORING_KIT_PACKAGE, EDUCATOR_PACKAGE, EDUCATOR_PACKAGES,
// TOOLKIT_SUBSCRIPTION) were removed after audit confirmed no active UI
// imports. Current active pricing lives in `src/config/promo.ts` (getPrice /
// getRegularPrice) and per-page product arrays in Upgrade.tsx / GiftCard.tsx.

export const CURRENCY = "ILS";
export const CURRENCY_SYMBOL = "₪";
