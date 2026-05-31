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

/**
 * Opens the given Grow payment link in a new tab.
 * Falls back to same-tab navigation if the popup is blocked.
 */
export const openGrowCheckout = (key: GrowLinkKey) => {
  const url = GROW_LINKS[key];
  if (!url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.href = url;
  }
};