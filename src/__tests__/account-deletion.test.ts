import { describe, it, expect } from "vitest";
import { emailTasteHash, decideTasteEligibility } from "../../supabase/functions/_shared/taste";

describe("free taste after account deletion", () => {
  it("same mailbox (alias / dots / case) gives the same code", async () => {
    const a = await emailTasteHash("Noa.Cohen+x@gmail.com");
    const b = await emailTasteHash("noacohen@googlemail.com");
    expect(a).toBe(b);
    expect(a!.startsWith("sha256:")).toBe(true);
  });
  it("code does not contain the email", async () => {
    const h = await emailTasteHash("noacohen@gmail.com");
    expect(h).not.toContain("noacohen");
  });
  it("different mailboxes give different codes", async () => {
    expect(await emailTasteHash("a@x.com")).not.toBe(await emailTasteHash("b@x.com"));
  });
  it("re-signup with a stored code is not eligible for another taste", () => {
    const d = decideTasteEligibility({ hasPriorStory: false, userClaimed: false, emailClaimed: true, deviceClaimed: false, ipClaimsLast30d: 0 });
    expect(d.eligible).toBe(false);
  });
});
