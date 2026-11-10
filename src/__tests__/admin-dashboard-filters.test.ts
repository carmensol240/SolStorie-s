import { describe, it, expect } from "vitest";
import { isOwnAccountEmail, isRealPurchase, storyLabel } from "@/lib/admin-dashboard-filters";

describe("admin dashboard display rules", () => {
  it("hides solstories.nlp and carmit1901 accounts, not customers", () => {
    expect(isOwnAccountEmail("solstories.nlp@gmail.com")).toBe(true);
    expect(isOwnAccountEmail("carmit1901@gmail.com")).toBe(true);
    expect(isOwnAccountEmail("carmit1901+test@gmail.com")).toBe(true);
    expect(isOwnAccountEmail("souldesign06@gmail.com")).toBe(true);
    expect(isOwnAccountEmail("liorcohen11111@gmail.com")).toBe(false);
  });

  it("monthly totals count only real completed purchases this month", () => {
    const start = new Date("2026-11-01T00:00:00");
    expect(isRealPurchase({ status: "completed", created_at: "2026-11-05T10:00:00Z" }, start, false)).toBe(true);
    expect(isRealPurchase({ status: "test_completed", created_at: "2026-11-05T10:00:00Z" }, start, false)).toBe(false);
    expect(isRealPurchase({ status: "completed", created_at: "2026-11-05T10:00:00Z" }, start, true)).toBe(false);
    expect(isRealPurchase({ status: "completed", created_at: "2026-10-20T10:00:00Z" }, start, false)).toBe(false);
  });

  it("never counts the owner's test purchase grow_530661331", () => {
    const start = new Date("2026-11-01T00:00:00");
    expect(isRealPurchase({ status: "completed", created_at: "2026-11-04T09:56:13Z", package_name: "grow_530661331_popular" }, start, false)).toBe(false);
    expect(isRealPurchase({ status: "completed", created_at: "2026-11-04T09:56:13Z", package_name: "grow_530661332_popular" }, start, false)).toBe(true);
  });

  it("labels stories as taste/full and needs-attention/ready", () => {
    expect(storyLabel({ is_taste: true, generation_status: "ready" })).toEqual(["טעימה", "מוכן"]);
    expect(storyLabel({ is_taste: false, generation_status: "needs_attention" })).toEqual(["סיפור מלא", "דורש טיפול"]);
  });
});
