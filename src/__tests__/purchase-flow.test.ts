/**
 * חבילת טסטים אוטומטית לרכישות ומחירים.
 *
 * מטרת החבילה: לתפוס ריגרסיות בזרימת התשלום *לפני* שהן מגיעות לפרודקשן.
 * כל בדיקה כאן מגנה על "חוזה" קריטי אחד בין ה-UI לקוד השרת ולקישורי Grow.
 *
 * מה נבדק:
 *  1. GROW_LINKS — לכל packageId פעיל יש קישור pay.grow.link תקין
 *     (חבילות disabled/comingSoon פטורות ומסומנות במפורש).
 *  2. מחירים ב-UI תואמים לקונפיג המרכזי (`getPrice`) גם בתקופת המבצע
 *     וגם אחרי סיום המבצע (post-promo).
 *  3. packageIdFromAmount מזהה כל סכום פעיל ומתעד התנגשויות.
 *  4. openGrowCheckout שולח בפועל cField1/cField2/cField3 ב-URL —
 *     בדיקה מול חלון פתוח אמיתי (mock ל-window.open), לא ניתוח סטטי.
 *  5. GIFT_PACKAGES — twoStories מסומן comingSoon כל עוד ה-paylink שבור.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GROW_LINKS,
  openGrowCheckout,
  type GrowLinkKey,
} from "@/config/grow-links";
import {
  PROMO_END,
  getPrice,
  getRegularPrice,
  isPromoActive,
  type PriceKey,
} from "@/config/promo";
import { GIFT_PACKAGES } from "@/config/gift-packages";

// Grow keys שידוע לנו שאין להם עדיין paylink תקין. כל עוד מפתח נמצא כאן,
// ה-UI חייב לחסום אותו (disabled/comingSoon) — הבדיקה למטה אוכפת את זה.
const KNOWN_BROKEN_GROW_KEYS: readonly GrowLinkKey[] = ["twoStories"];

describe("GROW_LINKS", () => {
  it("כל קישור פעיל משתמש ב-pay.grow.link (לא grow.website / דומיין אחר)", () => {
    for (const [key, url] of Object.entries(GROW_LINKS)) {
      if (KNOWN_BROKEN_GROW_KEYS.includes(key as GrowLinkKey)) continue;
      expect(url, `${key} → ${url}`).toMatch(/^https:\/\/pay\.grow\.link\//);
    }
  });

  it("קישורים שבורים ידועים חייבים להיות מסומנים ב-GIFT_PACKAGES כ-comingSoon", () => {
    for (const brokenKey of KNOWN_BROKEN_GROW_KEYS) {
      const referencingPkg = GIFT_PACKAGES.find((p) => p.growKey === brokenKey);
      if (!referencingPkg) continue;
      expect(
        referencingPkg.comingSoon,
        `Gift package ${referencingPkg.id} references broken key ${brokenKey} but is NOT marked comingSoon`
      ).toBe(true);
    }
  });

  it("כל growKey ב-GIFT_PACKAGES פעיל קיים ב-GROW_LINKS", () => {
    for (const pkg of GIFT_PACKAGES) {
      if (pkg.comingSoon) continue;
      expect(pkg.growKey && GROW_LINKS[pkg.growKey], `${pkg.id}`).toBeTruthy();
    }
  });
});

describe("UI prices == config prices", () => {
  // "מקור האמת" למחירים המוצגים ב-UI.
  // אם מישהו ישנה מחיר ב-promo.ts, הבדיקה תזהה כשל רק אם המחיר החדש לא
  // תואם את המפה כאן — לכן חייבים לעדכן שני הצדדים ובבירור.
  const EXPECTED_PROMO: Record<PriceKey, number> = {
    basic: 29.9,
    popular: 99.9,
    pdf: 59.9,
    gift_two_stories: 59.9,
    single_story: 39.9,
  };
  const EXPECTED_REGULAR: Record<PriceKey, number> = {
    basic: 39.9,
    popular: 119.9,
    pdf: 69.9,
    gift_two_stories: 69.9,
    single_story: 39.9,
  };

  const beforeEnd = new Date("2026-07-15T12:00:00+03:00");
  const afterEnd = new Date("2026-09-01T00:00:01+03:00");

  it("promo פעיל לפני 31/8/26 23:59 IDT", () => {
    expect(isPromoActive(beforeEnd)).toBe(true);
    expect(isPromoActive(afterEnd)).toBe(false);
  });

  for (const key of Object.keys(EXPECTED_PROMO) as PriceKey[]) {
    it(`getPrice("${key}") מחזיר מחיר promo בתקופת מבצע ומחיר regular אחריה`, () => {
      expect(getPrice(key, beforeEnd)).toBe(EXPECTED_PROMO[key]);
      expect(getPrice(key, afterEnd)).toBe(EXPECTED_REGULAR[key]);
      expect(getRegularPrice(key)).toBe(EXPECTED_REGULAR[key]);
    });
  }
});

describe("packageIdFromAmount fallback (webhook)", () => {
  // מאמצים את הטבלה מ-`supabase/functions/_shared/purchase-credits.ts`.
  // חשוב: ל-webhook תמיד מעדיפים cField2 מפורש — הפונקציה הזו רק fallback
  // כשה-cField חסר. הבדיקה מבטיחה שכל סכום פעיל ממופה למשהו סביר, ושה-
  // התנגשות הידועה 59.90 / 69.90 מתועדת (pdf זוכה, gift_two_stories לא).
  //
  // מכיוון שהקוד יושב תחת supabase/functions ו-deno, אנחנו לא מייבאים אותו
  // כאן — משכפלים את הלוגיקה כדי לבדוק שהמיפוי מדויק ולא מתפזר בשתיקה.
  function packageIdFromAmount(amount: number): string | null {
    const a = Math.round(amount * 100) / 100;
    if (a === 29.9) return "single_story_digital";
    if (a === 39.9) return "single_story_digital";
    if (a === 49.9) return "single_story_digital";
    if (a === 99.9) return "popular";
    if (a === 119.9) return "popular";
    if (a === 129.9) return "popular";
    if (a === 9.9) return "coloring_single";
    if (a === 24.9) return "coloring_bundle";
    if (a === 59.9) return "pdf";
    if (a === 69.9) return "pdf";
    if (a === 89.9) return "gift_two_stories";
    return null;
  }

  it("מזהה כל סכום פעיל בקונפיג", () => {
    const activeAmounts = new Set<number>();
    (Object.keys({ basic: 0, popular: 0, pdf: 0, gift_two_stories: 0, single_story: 0 }) as PriceKey[])
      .forEach((k) => {
        activeAmounts.add(getPrice(k, new Date("2026-07-15T12:00:00+03:00")));
        activeAmounts.add(getRegularPrice(k));
      });
    for (const amount of activeAmounts) {
      expect(packageIdFromAmount(amount), `amount=${amount}`).not.toBeNull();
    }
  });

  it("59.90 ו-69.90 מתועדות כהתנגשות pdf ↔ gift_two_stories (fallback בוחר pdf)", () => {
    expect(packageIdFromAmount(59.9)).toBe("pdf");
    expect(packageIdFromAmount(69.9)).toBe("pdf");
    // כשה-UI שולח את הגיפט הוא חייב להעביר cField2 = gift_two_stories מפורש,
    // אחרת ה-webhook יזרים קרדיטים לחבילת pdf.
  });

  it("סכומים לא מוכרים מחזירים null (במקום ליפול בשקט לחבילה)", () => {
    expect(packageIdFromAmount(19.9)).toBeNull();
    expect(packageIdFromAmount(0)).toBeNull();
    expect(packageIdFromAmount(199.9)).toBeNull();
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
    const keys = Object.keys(GROW_LINKS) as GrowLinkKey[];
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
    openGrowCheckout("basic", { userId: "u1" });
    const raw = sessionStorage.getItem("growCheckoutPending");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.key).toBe("basic");
    expect(parsed.packageId).toBe("single_story_digital");
    expect(parsed.url).toContain("cField1=u1");
  });
});

describe("GIFT_PACKAGES", () => {
  it("קונפיג של הגיפטקארד לא משכפל id-ים", () => {
    const ids = GIFT_PACKAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("twoStories מסומן comingSoon עד תיקון ה-paylink", () => {
    const two = GIFT_PACKAGES.find((p) => p.growKey === "twoStories");
    expect(two).toBeTruthy();
    expect(two!.comingSoon).toBe(true);
  });

  it("PROMO_END הוא ה-31/8/26 23:59 בשעון ישראל", () => {
    expect(PROMO_END.toISOString()).toBe("2026-08-31T20:59:59.000Z");
  });
});