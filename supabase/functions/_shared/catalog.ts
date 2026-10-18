// THE single source for what is sold: price, contents and Grow link.
// Read by the site (home page, lock screens, purchase screen, story screen)
// and by the server (amount check, credit grants). Change prices only here,
// and update the same amount on the Grow link.

export type ProductKey = "digital" | "full" | "pdf" | "full_pack3" | "digital_pack3";

export interface Product {
  key: ProductKey;
  /** Package id sent to Grow as cField2 and used by the server. */
  packageId: string;
  title: string;
  price: number;
  growUrl: string;
  /** What the parent gets (shown on cards). */
  includes: string[];
}

export const DIGITAL_INCLUDES = [
  "ספר מאויר שהילד הוא הגיבור שלו",
  "דמות שדומה לילד",
  "הקראה בקול והקלטת הקול שלכם",
  "הסיפור שמור לתמיד",
  "כל דפי הצביעה מאיורי הסיפור (צביעה אונליין והדפסה)",
];

export const CATALOG: Record<ProductKey, Product> = {
  digital: {
    key: "digital",
    packageId: "single_story",
    title: "סיפור דיגיטלי",
    price: 39.9,
    growUrl: "https://pay.grow.link/MTAxMTMz~c553eb7e7fdf0752b8277d9777188b87-MzQ3NDUyNg",
    includes: DIGITAL_INCLUDES,
  },
  full: {
    key: "full",
    packageId: "popular",
    title: "סיפור מלא",
    price: 69.9,
    growUrl: "https://pay.grow.link/MTAxMTMz~cb4021f916e22b79f369e594e6df3c22-NDE0NzM1Mw",
    includes: [...DIGITAL_INCLUDES, "📖 ספר אמיתי ביד: קובץ מוכן להדפסה בבית או בכל מכון הדפסה"],
  },
  pdf: {
    key: "pdf",
    packageId: "pdf",
    title: "קובץ להדפסה",
    price: 34.9,
    growUrl: "https://pay.grow.link/MTAxMTMz~966f337ed54d7ce20445cd22c4cc239e-MzQ3NDYxOA",
    includes: ["קובץ להדפסת הספר בבית, לסיפור שכבר נקנה"],
  },
  // Value packs — shown on the purchase screen only ("חבילות משתלמות").
  // growUrl stays empty until the Grow link is supplied (button is disabled meanwhile).
  full_pack3: {
    key: "full_pack3",
    packageId: "full_pack3",
    title: "3 סיפורים מלאים",
    price: 179,
    growUrl: "https://pay.grow.link/MTAxMTMz~4c066b17a38c2c7d52af981039a3559e-NDE1MTAzMQ",
    includes: ["3 סיפורים מלאים, כל אחד עם קובץ להדפסה ודפי צביעה"],
  },
  digital_pack3: {
    key: "digital_pack3",
    packageId: "digital_pack3",
    title: "3 סיפורים דיגיטליים",
    price: 99,
    growUrl: "https://pay.grow.link/MTAxMTMz~3fc959a3cdda1aa50d81ff0a7b40350d-NDE1MTA0Mw",
    includes: ["3 סיפורים דיגיטליים, כל אחד עם דפי צביעה"],
  },
};

/** How many story credits each package gives (for display; server uses packageConfig). */
export const PACK_STORY_COUNT: Partial<Record<ProductKey, number>> = { full_pack3: 3, digital_pack3: 3 };

/** Which kind of story credit a package gives (null = none). */
export function creditKindForPackage(packageId: string): "digital" | "full" | null {
  if (["popular", "full_pack3", "single_story_full", "gift_single_full"].includes(packageId)) return "full";
  if (["single_story", "digital_pack3", "single_story_digital", "basic", "gift_single_digital", "gift_two_stories"].includes(packageId)) return "digital";
  return null;
}
