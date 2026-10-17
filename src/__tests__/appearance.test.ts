import { describe, it, expect } from "vitest";
import {
  hairToEnglish,
  clothingToEnglish,
  mergeAppearance,
  resolvePageOutfit,
  buildCharacterLock,
} from "../../supabase/functions/_shared/appearance";

describe("parent appearance choices", () => {
  it("uses hairstyle alone, without hair color", () => {
    expect(hairToEnglish({ hairStyle: "קוקיות" })).toBe("hair styled in two pigtails (one on each side of the head)");
  });

  it("form values win over the saved profile, each field on its own", () => {
    const a = mergeAppearance({ hairStyle: "צמה" }, { hairStyle: "קצר", hairColor: "שחור" });
    expect(a.hairStyle).toBe("צמה");
    expect(a.hairColor).toBe("שחור");
  });

  it("parent clothes win over the topic outfit on normal pages", () => {
    const parent = clothingToEnglish({ clothingType: "שמלה", clothingColor: "כחול" });
    expect(resolvePageOutfit(parent, "astronaut space suit", "נועה רצה בגן")).toBe("a blue dress");
  });

  it("topic outfit only where the page text says the child wears it", () => {
    expect(resolvePageOutfit("a blue dress", "astronaut space suit", "נועה לובשת חליפת חלל")).toBe("astronaut space suit");
  });

  it("no parent clothes → topic outfit as before", () => {
    expect(resolvePageOutfit("", "astronaut space suit", "נועה רצה")).toBe("astronaut space suit");
  });

  it("character lock includes gender, age, hair and clothes", () => {
    const lock = buildCharacterLock({ gender: "female", age: 5, hair: "brown hair styled in two pigtails", outfit: "a blue dress" });
    expect(lock).toContain("a 5-year-old girl, with brown hair styled in two pigtails, wearing a blue dress");
  });
});
