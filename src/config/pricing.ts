export const PRICING_PACKAGES = [
  {
    id: "basic",
    stories: 3,
    price: 39,
    originalPrice: 39,
    pricePerStory: "13₪",
    label: "בסיסי",
    freeEdits: 3,
    freeColoringPages: 1,
    badge: "מושלם להתחלה ✨" as string | undefined,
  },
  {
    id: "popular",
    stories: 10,
    price: 99,
    originalPrice: 99,
    pricePerStory: "9.9₪",
    label: "פופולרי",
    freeEdits: 10,
    freeColoringPages: 3,
    badge: "מומלץ ⭐" as string | undefined,
  },
  {
    id: "premium",
    stories: 15,
    price: 139,
    originalPrice: 139,
    pricePerStory: "9.3₪",
    label: "משתלם",
    freeEdits: 15,
    freeColoringPages: 5,
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
  price: 19.90,
  label: "חבילת צביעה",
  badge: "🎨 לדפי צביעה" as string | undefined,
};

export const EDUCATOR_PACKAGE = {
  id: "educator",
  stories: 25,
  price: 199,
  pricePerStory: "8₪",
  label: "חבילת אנשי חינוך וטיפול",
  freeEdits: 25,
  freeColoringPages: 8,
  badge: "🏫 לאנשי חינוך וטיפול" as string | undefined,
};

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
