// Grow payment links. Each key represents a purchasable item / package.
// Used as the primary checkout flow; PayPal remains available as a fallback.
export const GROW_LINKS = {
  // Basic package — single digital story (49.90 ₪)
  basic: "https://pay.grow.link/MTAxMTMz~c553eb7e7fdf0752b8277d9777188b87-MzQ3NDUyNg",
  // Popular package — digital story + printable PDF (129.90 ₪)
  popular: "https://pay.grow.link/MTAxMTMz~f9ccdeaddca44b395381ec366f8af6c5-MzQ3NDUzMg",
  // Single story (49.90 ₪)
  singleStory: "https://pay.grow.link/MTAxMTMz~469de3bb12a9b6f58fe5d9c40ae3b868-MzQ3NDUzNw",
  // Single coloring page (9.90 ₪)
  coloringSingle: "https://pay.grow.link/MTAxMTMz~026a9822516963910b4c656b1533b479-MzQ3NDU0MA",
  // Coloring pages bundle for a whole story (24.90 ₪)
  coloringBundle: "https://pay.grow.link/MTAxMTMz~902b4d6ad465f743bf5de838d04f1c5b-MzQ3NDYxNQ",
  // Printable PDF file (69.90 ₪)
  pdf: "https://pay.grow.link/MTAxMTMz~966f337ed54d7ce20445cd22c4cc239e-MzQ3NDYxOA",
  // Two digital stories gift package (89.90 ₪) — TODO: replace with real link
  twoStories: "",
} as const;

export type GrowLinkKey = keyof typeof GROW_LINKS;

export interface GrowCheckoutOptions {
  discountPercent?: number;
  couponCode?: string | null;
  /** Authenticated user id — sent as cField1 so the Grow webhook can identify the buyer reliably (even if payerEmail differs from the account email). */
  userId?: string | null;
  /** Internal package id — sent as cField2 so the webhook applies credits for the exact package, instead of falling back to amount→package mapping. */
  packageId?: string | null;
  /** Optional story id / slug — sent as cField3 so single-story unlocks can be attached to the right story. */
  storyId?: string | null;
}

/**
 * Opens the given Grow payment link in a new tab.
 * Falls back to same-tab navigation if the popup is blocked.
 *
 * When a discount coupon has been applied, the discount percent and coupon
 * code are appended to the checkout URL as query params so Grow opens with
 * the discounted price (and the coupon is recorded against the transaction).
 */
export const openGrowCheckout = (
  key: GrowLinkKey,
  options: GrowCheckoutOptions = {}
) => {
  const base = GROW_LINKS[key];
  if (!base) return;

  let url: string = base;
  const { discountPercent, couponCode, userId, packageId, storyId } = options;

  try {
    const u = new URL(base);
    if (discountPercent && discountPercent > 0) {
      u.searchParams.set("discount", String(discountPercent));
    }
    if (couponCode) {
      u.searchParams.set("coupon", couponCode);
    }
    // Grow custom fields — surfaced back to us in the webhook payload as
    // customFields.cField1 / cField2 / cField3. Without these, the webhook has
    // to identify the user purely by payerEmail (which often mismatches the
    // account email) and cannot attach the purchase to a specific story.
    if (userId) {
      u.searchParams.set("cField1", userId);
    }
    if (packageId) {
      u.searchParams.set("cField2", packageId);
    }
    if (storyId) {
      u.searchParams.set("cField3", storyId);
    }
    url = u.toString();
  } catch {
    // If URL parsing fails for any reason, fall back to the base link.
    url = base;
  }

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.href = url;
  }
};