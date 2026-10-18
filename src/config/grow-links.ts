// Grow payment links (the only payment provider). Prices/links live in the central catalog.
import { CATALOG } from "../../supabase/functions/_shared/catalog";

// Links and package ids come from the central catalog.
export const GROW_LINKS = {
  digital: CATALOG.digital.growUrl,
  full: CATALOG.full.growUrl,
  pdf: CATALOG.pdf.growUrl,
  full_pack3: CATALOG.full_pack3.growUrl,
  digital_pack3: CATALOG.digital_pack3.growUrl,
} as const;

export type GrowLinkKey = keyof typeof GROW_LINKS;

const DEFAULT_PACKAGE_ID: Record<GrowLinkKey, string> = {
  digital: CATALOG.digital.packageId,
  full: CATALOG.full.packageId,
  pdf: CATALOG.pdf.packageId,
  full_pack3: CATALOG.full_pack3.packageId,
  digital_pack3: CATALOG.digital_pack3.packageId,
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