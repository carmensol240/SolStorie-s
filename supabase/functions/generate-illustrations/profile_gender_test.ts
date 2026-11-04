import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { alignProfileGender } from "../_shared/profile-gender.ts";
import { buildGenderHeader, genderSymbolRestriction, negativePromptFor } from "../_shared/style-config.ts";
import { buildCharacterLock } from "../_shared/appearance.ts";

const savedBoy = { gender: "male", genderHebrew: "ילד", hairDescription: "short brown boy's haircut", clothingDescription: "a boy superhero costume", ageDescription: "5", skinTone: "fair", eyeColor: "brown" };
const savedGirl = { gender: "female", genderHebrew: "ילדה", hairDescription: "long girl's braid", clothingDescription: "a girl's pink dress", ageDescription: "5", skinTone: "fair", eyeColor: "brown" };

// Same pieces generate-illustrations / retry-illustration put into one picture request.
function buildRequest(saved: typeof savedBoy, storyGender: "male" | "female") {
  const p = alignProfileGender(saved, storyGender).profile;
  const word = p.gender === "female" ? "girl" : "boy";
  return [
    buildGenderHeader(storyGender),
    `A ${word} aged ${p.ageDescription} with ${p.hairDescription}, wearing ${p.clothingDescription}.`,
    buildCharacterLock({ gender: p.gender, ageRange: "4-6", hair: p.hairDescription, outfit: p.clothingDescription }),
    genderSymbolRestriction(storyGender),
    `NEGATIVE: ${negativePromptFor(storyGender)}`,
  ].join("\n");
}

Deno.test("girl story with a saved boy profile never says boy/BOY", () => {
  const req = buildRequest(savedBoy, "female");
  assert(!/\bboys?\b/i.test(req), req);
  assert(/\bGIRL\b/.test(req));
});

Deno.test("boy story with a saved girl profile never says girl/GIRL", () => {
  const req = buildRequest(savedGirl, "male");
  assert(!/\bgirls?\b/i.test(req), req);
  assert(/\bBOY\b/.test(req));
});

Deno.test("saved profile is rewritten to the story's gender", () => {
  const { profile, changed } = alignProfileGender(savedBoy, "female");
  assertEquals(changed, true);
  assertEquals(profile.gender, "female");
  assertEquals(profile.genderHebrew, "ילדה");
  assertEquals(alignProfileGender(profile, "female").changed, false);
});
