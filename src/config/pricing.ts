export const PRICING_PACKAGES = [
  {
    id: "basic",
    stories: 5,
    price: 49,
    pricePerStory: "9.8₪",
    label: "בסיסי",
    freeEdits: 5,
    badge: undefined as string | undefined,
  },
  {
    id: "popular",
    stories: 10,
    price: 89,
    pricePerStory: "8.9₪",
    label: "פופולרי",
    freeEdits: 10,
    badge: "⭐ מומלץ" as string | undefined,
  },
  {
    id: "premium",
    stories: 15,
    price: 129,
    pricePerStory: "8.6₪",
    label: "משתלם",
    freeEdits: 15,
    badge: undefined as string | undefined,
  },
] as const;

export const EDUCATOR_PACKAGE = {
  id: "educator",
  stories: 30,
  price: 199,
  pricePerStory: "6.6₪",
  label: "חבילת מחנכים",
  freeEdits: 30,
  badge: "🏫 למחנכים" as string | undefined,
};

export const TOOLKIT_SUBSCRIPTION = {
  id: "toolkit_yearly",
  price: 29.90,
  label: "ארגז הכלים של SoulStory",
  description: "כלים מעולם ה-NLP וחינוך מקרב שמתעדכנים בכל חודש. הפכו כל רגע עם הילדים לרגע של חיבור עמוק וצמיחה.",
};

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
