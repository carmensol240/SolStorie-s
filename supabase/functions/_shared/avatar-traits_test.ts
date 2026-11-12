import { assertEquals } from "jsr:@std/assert@1";
import { applyAvatarTraits, avatarWinsRule, formHairFromShade, hairWithShade, normalizeHairShade, parseAvatarTraits, realAgeText, usesAvatarTraits, likenessFlags } from "./avatar-traits.ts";
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

Deno.test("saved hero_traits switch on features, close framing and avatar tones for an older story", () => {
  const old = "2026-11-11T16:41:34Z"; // before AVATAR_TRAITS_CUTOFF and LIKENESS_CUTOFF
  assertEquals(likenessFlags(old, null), { traitsOn: false, likenessOn: false });
  assertEquals(likenessFlags(old, []), { traitsOn: false, likenessOn: false });
  assertEquals(likenessFlags(old, ["short near-black hair swept to the side", "full round cheeks", "thick straight eyebrows"]), { traitsOn: true, likenessOn: true });
  assertEquals(likenessFlags("2026-11-12T08:00:00Z", null), { traitsOn: true, likenessOn: true });
  assertEquals(likenessFlags("2026-11-11T20:00:00Z", null), { traitsOn: true, likenessOn: false });
});

Deno.test("avatar render style: only stories created from the new cutoff, only with the avatar as face picture", async () => {
  const { usesAvatarStyle, AVATAR_STYLE_CUTOFF } = await import("./avatar-traits.ts");
  const after = new Date(Date.parse(AVATAR_STYLE_CUTOFF) + 60_000).toISOString();
  const before = new Date(Date.parse(AVATAR_STYLE_CUTOFF) - 60_000).toISOString();
  if (!usesAvatarStyle(after, true)) throw new Error("new story with avatar should use avatar style");
  if (usesAvatarStyle(before, true)) throw new Error("older story must stay unchanged");
  if (usesAvatarStyle("2026-11-11T16:41:00Z", true)) throw new Error("Uriel's story must stay unchanged");
  if (usesAvatarStyle(after, false)) throw new Error("a real photo is never the style source");
  if (usesAvatarStyle(null, true)) throw new Error("no date = unchanged");
});

Deno.test("avatar render style: an older story turns it on only with its own opt-in, never through hero_traits", async () => {
  const { usesAvatarStyle } = await import("./avatar-traits.ts");
  const old = "2026-11-11T16:41:00Z";
  if (!usesAvatarStyle(old, true, true)) throw new Error("opted-in older story should use avatar style");
  if (usesAvatarStyle(old, true, false) || usesAvatarStyle(old, true, null)) throw new Error("other older stories must stay unchanged");
  if (usesAvatarStyle(old, true, ["round face"])) throw new Error("hero_traits must never switch it on");
  if (usesAvatarStyle(old, false, true)) throw new Error("a real photo is never the style source, even with opt-in");
});
