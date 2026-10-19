import { describe, it, expect } from "vitest";
import { buildGenderHeader } from "../../supabase/functions/_shared/style-config";
import {
  hairToEnglish,
  clothingToEnglish,
  mergeAppearance,
  resolvePageOutfit,
  buildCharacterLock,
  buildCharacterCore,
  buildOutfitLine,
  pickDefaultOutfit,
  pageMentionsOutfit,
  kippahForRequest,
  kippahForStory,
  kippahColor,
} from "../../supabase/functions/_shared/appearance";

const RELIGIOUS = /kippah|yarmulke|tzitzit|sidelock|peyot|head covering|veil|hijab/i;
const CLOTHES = /wearing (?!glasses)|shirt|dress|pants|jeans|costume|swim|pajamas|coat|t-shirt/i;
const STYLES = ["בגדי יומיום", "גיבור/ת על", "שמלה", "בגד ים", "פיג'מה", "בגדי חורף"];

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
    const parent = clothingToEnglish({ clothingType: "שמלה", clothingColor: "כחול" }, "female");
    expect(resolvePageOutfit(parent, "astronaut space suit", "נועה רצה בגן")).toBe("a blue dress");
  });

  it("topic outfit only where the page text says the hero changes into it", () => {
    expect(resolvePageOutfit("a blue dress", "astronaut space suit", "נועה לובשת חליפת חלל")).toBe("astronaut space suit");
  });

  it("a plain 'wears' sentence no longer swaps the parent's clothes", () => {
    expect(pageMentionsOutfit("אמא לובשת חיוך גדול")).toBe(false);
    expect(resolvePageOutfit("a blue dress", "astronaut space suit", "אבא לובש כובע")).toBe("a blue dress");
  });

  it("next page returns to chosen clothes unless it continues the same scene", () => {
    const prev = "נועה מחליפה לפיג'מה";
    expect(resolvePageOutfit("a blue dress", "pajamas", "בבוקר נועה הולכת לגן", prev)).toBe("a blue dress");
    expect(resolvePageOutfit("a blue dress", "pajamas", "בפיג'מה הרכה נועה נכנסת למיטה", prev)).toBe("pajamas");
  });

  it("no parent clothes → topic outfit as before", () => {
    expect(resolvePageOutfit("", "astronaut space suit", "נועה רצה")).toBe("astronaut space suit");
  });

  it("character lock includes gender, age, hair and clothes", () => {
    const lock = buildCharacterLock({ gender: "female", age: 5, hair: "brown hair styled in two pigtails", outfit: "a blue dress" });
    expect(lock).toContain("a 5-year-old girl, with brown hair styled in two pigtails");
    expect(lock).toContain("wearing a blue dress");
  });
});

describe("clothing per gender", () => {
  it("a dress for a boy becomes everyday clothes", () => {
    expect(clothingToEnglish({ clothingType: "שמלה" }, "male")).toBe("a casual everyday clothes (t-shirt and pants)");
  });
  it("swimsuit differs by gender", () => {
    expect(clothingToEnglish({ clothingType: "בגד ים" }, "male")).toBe("a swim trunks");
    expect(clothingToEnglish({ clothingType: "בגד ים" }, "female")).toBe("a one-piece swimsuit");
  });
  it("no style, for boy or girl, adds religious items to the clothes part", () => {
    for (const g of ["male", "female"]) for (const t of STYLES) {
      expect(clothingToEnglish({ clothingType: t, clothingColor: "כחול" }, g)).not.toMatch(RELIGIOUS);
    }
  });
  it("default outfit is fixed per story and never religious", () => {
    expect(pickDefaultOutfit("story-1")).toBe(pickDefaultOutfit("story-1"));
    expect(pickDefaultOutfit("story-1")).not.toMatch(RELIGIOUS);
  });
});

describe("character core (future character card)", () => {
  it("has no clothes, keeps glasses, and says uncovered head", () => {
    const core = buildCharacterCore({ gender: "male", age: 6, hair: "black hair cut short", skin: "olive", eyes: "brown", glasses: true });
    expect(core).not.toMatch(CLOTHES);
    expect(core).toContain("wearing glasses");
    expect(core).toContain("uncovered head, hair visible");
  });
  it("a girl's character core and outfit never contain a kippah", () => {
    for (const t of STYLES) {
      const core = buildCharacterCore({ gender: "female", age: 5, hair: "brown hair" });
      const outfit = buildOutfitLine(clothingToEnglish({ clothingType: t }, "female"));
      expect(`${core} ${outfit}`).not.toMatch(/kippah|yarmulke/i);
    }
  });
});

describe("kippah (boy only, when ticked in the form)", () => {
  const lockFor = (gender: string, kippah: boolean, type: string, color = "") =>
    buildCharacterLock({ gender, age: 6, hair: "black hair", outfit: clothingToEnglish({ clothingType: type, clothingColor: color }, gender), kippah, kippahColor: kippahColor({ clothingColor: color }) });
  const NEVER = /tzitzit|sidelock|peyot/i;

  it("boy ticked: kippah on every outfit, in the clothes color or dark blue", () => {
    for (const t of STYLES) {
      const l = lockFor("male", kippahForRequest("male", true), t, "כחול");
      expect(l).toContain("small knitted blue kippah");
      expect(l).toContain("small kippah on the head, hair visible");
      expect(l).not.toContain("uncovered head");
    }
    expect(lockFor("male", true, "פיג'מה")).toContain("small knitted dark blue kippah");
  });

  it("boy not ticked: no kippah, uncovered head", () => {
    const l = lockFor("male", kippahForRequest("male", false), "בגדי יומיום");
    expect(l).not.toMatch(/kippah/i);
    expect(l).toContain("uncovered head, hair visible");
  });

  it("girl: never a kippah, even when a ticked value arrives", () => {
    expect(kippahForRequest("female", true)).toBe(false);
    expect(kippahForStory({ kippah: true, child_gender: "female" }).kippah).toBe(false);
    expect(lockFor("female", true, "שמלה")).not.toMatch(/kippah/i);
  });

  it("profile with kippah + form unticked (or missing) = no kippah", () => {
    expect(kippahForRequest("male", false)).toBe(false);
    expect(kippahForRequest("male", undefined)).toBe(false);
    expect(kippahForRequest("male", "true")).toBe(false);
  });

  it("redraw in an older story after the profile changed = no kippah (story columns only)", () => {
    expect(kippahForStory({ kippah: false, child_gender: "male", kippah_color: null }).kippah).toBe(false);
  });

  it("story color is kept for the same story", () => {
    expect(kippahForStory({ kippah: true, child_gender: "male", kippah_color: "red" })).toEqual({ kippah: true, color: "red" });
  });

  it("never tzitzit or sidelocks in the character or clothes parts", () => {
    for (const g of ["male", "female"]) for (const k of [true, false]) for (const t of STYLES) {
      expect(lockFor(g, k, t, "ירוק")).not.toMatch(NEVER);
    }
  });

  it("header: boy with kippah requires it; girl header always bans it", () => {
    expect(buildGenderHeader("male", { kippah: true })).toContain("MUST appear on his head on EVERY page");
    expect(buildGenderHeader("female", { kippah: true })).not.toContain("MUST appear on his head");
  });
});
