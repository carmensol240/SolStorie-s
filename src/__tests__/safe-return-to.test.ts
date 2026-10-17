import { describe, it, expect } from "vitest";
import { safeReturnTo } from "@/lib/safe-return-to";

describe("safeReturnTo", () => {
  it("keeps internal paths", () => {
    expect(safeReturnTo("/library")).toBe("/library");
    expect(safeReturnTo("/create?resume=true")).toBe("/create?resume=true");
  });
  it("rejects protocol-relative paths", () => {
    expect(safeReturnTo("//evil.com")).toBe("/create");
    expect(safeReturnTo("/\\evil.com")).toBe("/create");
  });
  it("rejects external urls and empty values", () => {
    expect(safeReturnTo("https://evil.com")).toBe("/create");
    expect(safeReturnTo("javascript:alert(1)")).toBe("/create");
    expect(safeReturnTo("")).toBe("/create");
    expect(safeReturnTo(null)).toBe("/create");
  });
});
