// Gift card packages data. Extracted from GiftCard.tsx so tests can validate
// package/link/price consistency without importing the full page component
// (which pulls in supabase, hooks, routing, etc).
import type { GrowLinkKey } from "@/config/grow-links";
import type { PriceKey } from "@/config/promo";

export interface GiftPackage {
  id: string;
  stories: number;
  priceKey: PriceKey;
  label: string;
  subtitle: string;
  growKey: GrowLinkKey | null;
  coloringDesc?: string;
  /** True when the Grow link is broken / not ready. Renders a "בקרוב" badge
   *  and disables the purchase button. */
  comingSoon?: boolean;
}

export const GIFT_PACKAGES: readonly GiftPackage[] = [
  {
    id: "gift_single_digital",
    stories: 1,
    priceKey: "basic",
    label: "סיפור בודד",
    subtitle: "דיגיטלי",
    growKey: "basic",
    coloringDesc: "🎨 דף צביעה אחד במתנה — לצביעה אונליין ולהדפסה",
  },
  {
    id: "gift_two_stories",
    stories: 2,
    priceKey: "gift_two_stories",
    label: "2 סיפורים דיגיטליים",
    subtitle: "חבילה זוגית",
    growKey: "twoStories",
    coloringDesc:
      "✨ 2 סיפורים מותאמים אישית עם הילד כגיבור — 🎨 2 דפי צביעה במתנה — לצביעה אונליין ולהדפסה",
  },
  {
    id: "gift_single_full",
    stories: 1,
    priceKey: "popular",
    label: "סיפור דיגיטלי + קובץ להדפסת ספר + חבילת דפי צביעה",
    subtitle: "חוויה מלאה",
    growKey: "popular",
    coloringDesc: "🎨 חבילת דפי צביעה מלאה — לצביעה אונליין ולהדפסה",
  },
] as const;