/** Payment links: every link sends the buyer, package and story to Grow. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GROW_LINKS, openGrowCheckout, type GrowLinkKey } from "@/config/grow-links";
import { CATALOG } from "@/config/promo";

describe("GROW_LINKS", () => {
  it("every link is a pay.grow.link from the catalog", () => {
    for (const [key, url] of Object.entries(GROW_LINKS).filter(([, u]) => u)) {
      expect(url, key).toMatch(/^https:\/\/pay\.grow\.link\//);
      expect(url).toBe(CATALOG[key as keyof typeof CATALOG].growUrl);
    }
  });
});

describe("openGrowCheckout — cField1/2/3 באמת נשלחים ב-URL", () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // חלון פתוח אמיתי אינו זמין ב-jsdom — לוכדים את ה-URL שהיה נפתח.
    openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => ({ closed: false } as Window));
    // sessionStorage/localStorage קיימים ב-jsdom, אין צורך למוק.
    sessionStorage.clear();
  });
  afterEach(() => {
    openSpy.mockRestore();
  });

  it("כל key ב-GROW_LINKS פותח URL עם cField1/2 (ו-cField3 כשמעבירים storyId)", () => {
    const keys = (Object.keys(GROW_LINKS) as GrowLinkKey[]).filter((k) => GROW_LINKS[k]);
    for (const key of keys) {
      openSpy.mockClear();
      openGrowCheckout(key, {
        userId: "user-abc-123",
        storyId: "story-xyz-789",
      });
      expect(openSpy).toHaveBeenCalledTimes(1);
      const url = openSpy.mock.calls[0][0] as string;
      const parsed = new URL(url);
      expect(parsed.searchParams.get("cField1"), `${key} cField1`).toBe(
        "user-abc-123"
      );
      // cField2 חייב להיות שם החבילה הפנימי — לא ריק.
      expect(parsed.searchParams.get("cField2"), `${key} cField2`).toBeTruthy();
      expect(parsed.searchParams.get("cField3"), `${key} cField3`).toBe(
        "story-xyz-789"
      );
    }
  });

  it("שומר growCheckoutPending ב-sessionStorage כדי שה-GlobalPurchaseHandler יאתר את החזרה", () => {
    openGrowCheckout("digital", { userId: "u1" });
    const raw = sessionStorage.getItem("growCheckoutPending");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.key).toBe("digital");
    expect(parsed.packageId).toBe("single_story");
    expect(parsed.url).toContain("cField1=u1");
  });
});

describe("Upgrade page — ProductId ↔ PRODUCTS coherence", () => {
  it("כל ProductId שנשלח ל-setSelectedProduct נמצא ב-PRODUCTS או שהוא coloring_pages", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.resolve(__dirname, "../pages/Upgrade.tsx"),
      "utf8",
    );

    // 1) חלץ את מזהי המוצרים מתוך מערך PRODUCTS (id: "digital" | "popular" וכו').
    const productIds = new Set<string>();
    const productBlock = src.match(/const PRODUCTS[^\[]*\[([\s\S]*?)\n\];/);
    expect(productBlock, "PRODUCTS array should exist in Upgrade.tsx").toBeTruthy();
    for (const m of productBlock![1].matchAll(/id:\s*"([^"]+)"/g)) {
      productIds.add(m[1]);
    }
    expect(productIds.size).toBeGreaterThan(0);

    // 2) חלץ כל setSelectedProduct("...") מה-JSX.
    const called = new Set<string>();
    for (const m of src.matchAll(/setSelectedProduct\(\s*"([^"]+)"\s*\)/g)) {
      called.add(m[1]);
    }
    // גם וריאנט דינמי setSelectedProduct(product.id) — נסמך על PRODUCTS.map.
    // עצם קיומו לא דורש בדיקה נוספת: product.id בטבעו ⊆ PRODUCTS.

    // 3) חייבים לכסות: או שהוא ב-PRODUCTS, או שהוא "coloring_pages" (special-case).
    const SPECIAL_CASES = new Set(["coloring_pages"]);
    for (const id of called) {
      const covered = productIds.has(id) || SPECIAL_CASES.has(id);
      expect(
        covered,
        `setSelectedProduct("${id}") ב-Upgrade.tsx חייב להיות ב-PRODUCTS או במקרים מיוחדים (${[
          ...SPECIAL_CASES,
        ].join(", ")}). אחרת PRODUCTS.find יחזיר undefined והדף יקרוס.`,
      ).toBe(true);
    }
  });
});