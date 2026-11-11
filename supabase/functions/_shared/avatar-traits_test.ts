import { assertEquals } from "jsr:@std/assert@1";
import { applyAvatarTraits, avatarWinsRule, formHairFromShade, hairWithShade, normalizeHairShade, parseAvatarTraits, realAgeText, usesAvatarTraits } from "./avatar-traits.ts";
import { lookProblemsFrom, isLookOnly } from "./look-check.ts";
import { keptTryAfterFailedRedraws } from "./cover-check.ts";

Deno.test("real age from profile wins over the age range", () => {
  assertEquals(realAgeText(4, "2-4"), "4");
  assertEquals(realAgeText(null, "2-4"), "2-4");
  const p = applyAvatarTraits({ hairDescription: "dark brown short crew cut", eyeColor: "brown", skinTone: "fair", ageDescription: "2-4" }, null, realAgeText(4, "2-4"));
  assertEquals(p.ageDescription, "4");
});

Deno.test("avatar hair shade replaces the text hair color", () => {
  assertEquals(normalizeHairShade("almost black"), "near-black very dark brown");
  assertEquals(hairWithShade("dark brown short textured crew cut", "near-black very dark brown"), "near-black very dark brown hair, short textured crew cut");
  const t = parseAvatarTraits('{"hair_shade":"near-black very dark brown","eye_color":"dark brown","skin_tone":"fair"}')!;
  const p = applyAvatarTraits({ hairDescription: "dark brown crew cut", eyeColor: "warm brown", skinTone: "medium", ageDescription: "2-4" }, t, "4");
  assertEquals(p.hairDescription.startsWith("near-black very dark brown hair"), true);
  assertEquals(p.eyeColor, "dark brown");
  assertEquals(p.skinTone, "fair");
  assertEquals(avatarWinsRule(t, "4").includes("ALWAYS wins"), true);
});

Deno.test("empty profile hair is filled with a valid form value", () => {
  assertEquals(formHairFromShade("near-black very dark brown"), "שחור");
  assertEquals(formHairFromShade("medium brown"), "חום");
});

Deno.test("only stories after the cutoff use avatar traits", () => {
  assertEquals(usesAvatarTraits("2026-11-01T00:00:00Z"), false);
  assertEquals(usesAvatarTraits("2026-12-01T00:00:00Z"), true);
});

Deno.test("a page failing the avatar check is a look problem: kept with the closest picture, never empty", () => {
  const problems = lookProblemsFrom({ avatar_face_match: false, avatar_age_match: false, avatar_hair_match: false });
  assertEquals(problems, ["avatar face", "avatar age", "avatar hair"]);
  assertEquals(isLookOnly(problems), true);
  // after the redraw still failing: one of the tries is kept
  const kept = keptTryAfterFailedRedraws(5, false, [
    { image: "a", problems: ["avatar hair", "avatar age"], reason: "older, lighter hair" },
    { image: "b", problems: ["avatar hair"], reason: "lighter hair" },
  ]);
  assertEquals(kept?.best.image, "b");
  assertEquals(kept?.identityCheck.startsWith("look mismatch kept"), true);
});
