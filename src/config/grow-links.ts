// Grow payment links. Each key represents a purchasable item / package.
// Grow is the sole active payment provider.
//
// ⚠️ חשוב: המחירים כאן הם חיצוניים — הם מוגדרים בלוח הבקרה של Grow עצמו,
// לא בקוד הזה. ה-URL רק פותח את דף התשלום; המחיר הנגבה בפועל נשלט ע"י Grow.
// כשמעדכנים מחיר ב-`src/config/promo.ts` (למשל בהחלפת promo→regular ב-1/9/26),
// חובה לעדכן ידנית את אותו מחיר גם בכל לינק כאן דרך ממשק Grow — אחרת ה-UI
// יראה מחיר אחד וה-checkout יגבה מחיר אחר.
export const GROW_LINKS = {
  // Basic package — single digital story (promo 29.90 ₪ / regular 39.90 ₪)
  basic: "https://pay.grow.link/MTAxMTMz~c553eb7e7fdf0752b8277d9777188b87-MzQ3NDUyNg",
  // Popular package — digital story + printable PDF (promo 99.90 ₪ / regular 119.90 ₪)
  popular: "https://pay.grow.link/MTAxMTMz~f9ccdeaddca44b395381ec366f8af6c5-MzQ3NDUzMg",
  // Single digital story — DemoLockModal main button (39.90 ₪ קבוע)
  singleStory: "https://pay.grow.link/MTAxMTMz~469de3bb12a9b6f58fe5d9c40ae3b868-MzQ3NDUzNw",
  // Single coloring page (9.90 ₪)
  coloringSingle: "https://pay.grow.link/MTAxMTMz~026a9822516963910b4c656b1533b479-MzQ3NDU0MA",
  // Coloring pages bundle for a whole story (24.90 ₪)
  coloringBundle: "https://pay.grow.link/MTAxMTMz~902b4d6ad465f743bf5de838d04f1c5b-MzQ3NDYxNQ",
  // Printable PDF file — PrintPdfOfferModal (promo 59.90 ₪ / regular 69.90 ₪)
  pdf: "https://pay.grow.link/MTAxMTMz~966f337ed54d7ce20445cd22c4cc239e-MzQ3NDYxOA",
  // Two digital stories gift package (promo 59.90 ₪ / regular 69.90 ₪)
  twoStories: "https://grow.website/products/view/477248",
} as const;

export type GrowLinkKey = keyof typeof GROW_LINKS;

/**
 * Mapping from Grow link key → internal packageId expected by the
 * verify-purchase / grow-webhook edge functions. Used as the default cField2
 * when the caller does not pass an explicit packageId.
 */
const DEFAULT_PACKAGE_ID: Record<GrowLinkKey, string> = {
  basic: "single_story_digital",
  popular: "popular",
  singleStory: "single_story",
  coloringSingle: "coloring_single",
  coloringBundle: "coloring_bundle",
  pdf: "pdf",
  twoStories: "gift_two_stories",
};

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
  const { discountPercent, couponCode, userId, storyId } = options;
  const packageId = options.packageId ?? DEFAULT_PACKAGE_ID[key] ?? null;

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

  // Flag pending checkout so the global purchase handler knows to poll on
  // window focus and show the success modal in ANY flow (Upgrade, DemoLock,
  // ColoringPurchase, PDF offer, etc.).
  try {
    sessionStorage.setItem(
      "growCheckoutPending",
      JSON.stringify({
        key,
        packageId,
        startedAt: Date.now(),
        // Persist the resolved checkout URL so the global failure-recovery
        // modal can re-open the exact same checkout on "Retry" without
        // needing to know which paywall/component initiated it.
        url,
        options: {
          discountPercent: discountPercent ?? null,
          couponCode: couponCode ?? null,
          userId: userId ?? null,
          storyId: storyId ?? null,
          packageId,
        },
      })
    );
  } catch {}

  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win && !win.closed) return;

  // Popup was blocked (common on mobile Safari and inside in-app webviews
  // like Instagram/Facebook/TikTok). DO NOT fall back to
  // `window.location.href = url` — that replaces the app tab with the Grow
  // checkout, and when the user closes Grow the app appears to "disappear".
  //
  // Instead, surface a toast with a real <a target="_blank"> the user can
  // tap. A user-gesture click on an anchor is not blocked by popup blockers
  // and works inside in-app browsers, while leaving the app tab intact.
  void import("sonner").then(({ toast }) => {
    toast("הדפדפן חסם את חלון התשלום", {
      description: "לחצו כדי להמשיך לתשלום בכרטיסייה חדשה",
      duration: 15000,
      action: {
        label: "המשך לתשלום",
        onClick: () => {
          // Real user gesture — allowed by popup blockers / in-app webviews.
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
      },
    });
  });
};