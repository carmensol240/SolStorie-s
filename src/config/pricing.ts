export const PRICING_PACKAGES = [
  {
    id: "basic",
    stories: 5,
    price: 39,
    pricePerStory: "7.8₪",
    label: "בסיסי",
    freeEdits: 1,
    badge: undefined as string | undefined,
  },
  {
    id: "popular",
    stories: 10,
    price: 59,
    pricePerStory: "5.9₪",
    label: "פופולרי",
    freeEdits: 2,
    badge: "⭐ מומלץ" as string | undefined,
  },
  {
    id: "premium",
    stories: 20,
    price: 99,
    pricePerStory: "4.95₪",
    label: "משתלם",
    freeEdits: 3,
    badge: undefined as string | undefined,
  },
] as const;

export const CURRENCY = "ILS";
export const CURRENCY_SYMBOL = "₪";

export const PAYPAL_CLIENT_ID = "AffM7iJE3sqAisjBHuiwL0YYi_W5YT9VDKbMB-wM5XBT7HdwoNjyYtfzUWY3dcK6MVkAr3GSjoEvuVDH";

export type PricingPackage = {
  id: string;
  stories: number;
  price: number;
  pricePerStory: string;
  label: string;
  freeEdits: number;
  badge?: string;
};
