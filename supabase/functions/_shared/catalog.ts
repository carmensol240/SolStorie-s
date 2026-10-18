// THE single source for what is sold: price, contents and Grow link.
// Read by the site (home page, lock screens, purchase screen, story screen)
// and by the server (amount check, credit grants). Change prices only here,
// and update the same amount on the Grow link.

export type ProductKey = "digital" | "full" | "pdf";

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
    includes: ["כל מה שבסיפור הדיגיטלי, ובנוסף: קובץ להדפסת הספר בבית"],
  },
  pdf: {
    key: "pdf",
    packageId: "pdf",
    title: "קובץ להדפסה",
    price: 34.9,
    growUrl: "https://pay.grow.link/MTAxMTMz~966f337ed54d7ce20445cd22c4cc239e-MzQ3NDYxOA",
    includes: ["קובץ להדפסת הספר בבית, לסיפור שכבר נקנה"],
  },
};

/** Which kind of story credit a package gives (null = none). */
export function creditKindForPackage(packageId: string): "digital" | "full" | null {
  if (["popular", "single_story_full", "gift_single_full"].includes(packageId)) return "full";
  if (["single_story", "single_story_digital", "basic", "gift_single_digital", "gift_two_stories"].includes(packageId)) return "digital";
  return null;
}
