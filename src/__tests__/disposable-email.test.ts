import { describe, it, expect } from "vitest";
import { isDisposableEmail } from "../../supabase/functions/_shared/disposable-email";

describe("disposable email block", () => {
  it("blocks testing and throwaway services", () => {
    for (const e of ["q3cto@pnqsmtnz.mailosaur.net", "wu679z+x@guerrillamail.info", "a@mailinator.com", "a@yopmail.com", "a@tempmail.com", "a@10minutemail.com"])
      expect(isDisposableEmail(e)).toBe(true);
  });
  it("allows regular addresses", () => {
    for (const e of ["someone@gmail.com", "a@walla.co.il", "a@outlook.com", "a@soulstory.co.il"])
      expect(isDisposableEmail(e)).toBe(false);
  });
});
