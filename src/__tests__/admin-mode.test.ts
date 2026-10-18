import { describe, it, expect } from "vitest";
import { effectiveAdminFor } from "@/hooks/use-admin-mode";

describe("admin view mode", () => {
  it("admin in demo mode is not an effective admin", () => expect(effectiveAdminFor(true, "demo")).toBe(false));
  it("admin in admin mode is an effective admin", () => expect(effectiveAdminFor(true, "admin")).toBe(true));
  it("admin with no saved mode defaults to admin", () => expect(effectiveAdminFor(true, null)).toBe(true));
  it("regular user stays locked even with tester_mode=admin in the browser", () => {
    localStorage.setItem("tester_mode", "admin");
    expect(effectiveAdminFor(false, "admin")).toBe(false);
  });
});
