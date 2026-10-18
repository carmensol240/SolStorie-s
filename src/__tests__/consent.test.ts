import { describe, it, expect, beforeEach } from "vitest";
import { hasAdConsent, setConsent } from "@/lib/consent";

describe("cookie consent", () => {
  beforeEach(() => localStorage.clear());
  it("no choice = no ad trackers", () => expect(hasAdConsent()).toBe(false));
  it("'necessary only' = no ad trackers", () => { setConsent("necessary"); expect(hasAdConsent()).toBe(false); });
  it("'accept all' allows trackers", () => { setConsent("all"); expect(hasAdConsent()).toBe(true); });
  it("changing back to necessary stops trackers", () => { setConsent("all"); setConsent("necessary"); expect(hasAdConsent()).toBe(false); });
});
