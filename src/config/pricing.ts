export const PRICING_PACKAGES = [
  {
    id: "basic",
    stories: 2,
    price: 79,
    originalPrice: 79,
    pricePerStory: "39.5₪",
    label: "2 סיפורים דיגיטליים",
    freeEdits: 2,
    freeColoringPages: 2,
    badge: "להתנסות ✨" as string | undefined,
  },
  {
    id: "popular",
    stories: 6,
    price: 199,
    originalPrice: 199,
    pricePerStory: "33.2₪",
    label: "הכי פופולרי",
    freeEdits: 6,
    freeColoringPages: 6,
    badge: "מומלץ ⭐" as string | undefined,
  },
  {
    id: "premium",
    stories: 10,
    price: 279,
    originalPrice: 279,
    pricePerStory: "27.9₪",
    label: "לאוהבי סיפורים",
    freeEdits: 10,
    freeColoringPages: 10,
    badge: "הכי משתלם 💰" as string | undefined,
  },
] as const;

export const EDIT_KIT_PACKAGE = {
  id: "edit_kit",
  edits: 5,
  price: 9.90,
  label: "חבילת עריכות",
  badge: "✏️ לעריכת סיפורים" as string | undefined,
};

export const COLORING_KIT_PACKAGE = {
  id: "coloring_kit",
  pages: 5,
  price: 24.90,
  label: "חבילת צביעה",
  badge: "🎨 לדפי צביעה" as string | undefined,
};

export const EDUCATOR_PACKAGE = {
  id: "educator",
  stories: 20,
  price: 229,
  pricePerStory: "11.5₪",
  label: "חבילת אנשי חינוך וטיפול",
  freeEdits: 25,
  freeColoringPages: 8,
  badge: "🏫 לאנשי חינוך וטיפול" as string | undefined,
};

export const EDUCATOR_PACKAGES = [
  {
    id: "educator_basic",
    stories: 2,
    price: 79,
    originalPrice: 79,
    pricePerStory: "39.5₪",
    label: "2 סיפורים דיגיטליים",
    freeEdits: 2,
    freeColoringPages: 2,
    badge: "להתנסות ✨" as string | undefined,
  },
  {
    id: "educator_popular",
    stories: 6,
    price: 199,
    originalPrice: 199,
    pricePerStory: "33.2₪",
    label: "פופולרי",
    freeEdits: 6,
    freeColoringPages: 6,
    badge: "מומלץ ⭐" as string | undefined,
  },
  {
    id: "educator_premium",
    stories: 10,
    price: 249,
    originalPrice: 249,
    pricePerStory: "24.9₪",
    label: "מקצועית",
    freeEdits: 10,
    freeColoringPages: 10,
    badge: "🎓 מקצועית" as string | undefined,
  },
] as const;

export const TOOLKIT_SUBSCRIPTION = {
  id: "toolkit_yearly",
  price: 29.90,
  label: "ארגז הכלים של SolStorie's™",
  description: "כלים מעולם ה-NLP וחינוך מקרב שמתעדכנים בכל חודש. הפכו כל רגע עם הילדים לרגע של חיבור עמוק וצמיחה.",
};

export const CURRENCY = "ILS";
export const CURRENCY_SYMBOL = "₪";

// ⚠️ SET TO false BEFORE DEPLOYING TO PRODUCTION
export const PAYPAL_SANDBOX = false;

export const PAYPAL_SANDBOX_CLIENT_ID = "Ac9EHf8z3a7W8Ewy5MGdUzc9lc7ThzaflNMNjjLXNqBmReU2FZfl98ZCyJ9f_LpSXJRUDJdHMdFelyO_";
export const PAYPAL_LIVE_CLIENT_ID = "AffM7iJE3sqAisjBHuiwL0YYi_W5YT9VDKbMB-wM5XBT7HdwoNjyYtfzUWY3dcK6MVkAr3GSjoEvuVDH";
export const PAYPAL_CLIENT_ID = PAYPAL_SANDBOX ? PAYPAL_SANDBOX_CLIENT_ID : PAYPAL_LIVE_CLIENT_ID;

export type PricingPackage = {
  id: string;
  stories: number;
  price: number;
  originalPrice: number;
  pricePerStory: string;
  label: string;
  freeEdits: number;
  freeColoringPages: number;
  badge?: string;
};
