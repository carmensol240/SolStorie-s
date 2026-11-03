import { describe, it, expect } from "vitest";
import { selfAgeMismatch } from "@/lib/self-age";
import { heroHair } from "../../supabase/functions/_shared/appearance";

describe("child's own age in fixed details", () => {
  it('"בת 3" with age 1 chosen asks the parent', () => {
    expect(selfAgeMismatch("בת 3, בת אחרי 2 בנים, אחות לניב בן 16", 1)).toBe(3);
  });
  it('"אח גדול בן 10" never asks', () => {
    expect(selfAgeMismatch("אח גדול בן 10, כלב בשם בוני", 4)).toBeNull();
  });
  it("same age as chosen does not ask", () => {
    expect(selfAgeMismatch("בן 4", 4)).toBeNull();
  });
});

describe("hair with an avatar", () => {
  it("form hair does not override the avatar's hair", () => {
    expect(heroHair("light brown hair with a hair clip", "dark brown high bun", true)).toBe("dark brown high bun");
  });
  it("form hair is used when there is no picture", () => {
    expect(heroHair("light brown hair with a hair clip", "dark brown high bun", false)).toBe("light brown hair with a hair clip");
  });
});
