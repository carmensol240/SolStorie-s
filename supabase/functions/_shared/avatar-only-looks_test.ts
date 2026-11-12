// Looks come only from the avatar + the parent's free text (12-11-2026).
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { APPEARANCE_FROM_AVATAR_CUTOFF, formAppearanceFor, usesFormAppearance, mergeAppearance, hairToEnglish, clothingToEnglish } from "./appearance.ts";
import { hasAvatarSource } from "./face-required.ts";
import {
  buildShortIllustrationPrompt, cleanSavedScene, clothesCheckQuestions, clothesProblemsFrom, clothesFixInstruction,
  hasHardProblem, onlyCharactersLine, stripHeroHair, stripStyleWords, CLOTHES_JSON_KEYS,
  HERO_CLOTHES_WRITER_RULE_HE, HERO_CLOTHES_WRITER_RULE_EN,
} from "./short-prompt.ts";
import { redrawDecision } from "./style-check.ts";
import { keptTryAfterFailedRedraws } from "./cover-check.ts";
import { buildIllustrationPrompt } from "./illustration-prompt.ts";

const before = new Date(Date.parse(APPEARANCE_FROM_AVATAR_CUTOFF) - 60_000).toISOString();
const after = new Date(Date.parse(APPEARANCE_FROM_AVATAR_CUTOFF) + 60_000).toISOString();
// Ari's old saved profile values.
const ariProfile = { hairColor: "בלונדיני", hairStyle: "קצר", clothingType: "גיבור/ת על", clothingColor: "אדום" };

Deno.test("new stories ignore the saved hair/clothing fields (Ari: blond + red superhero never reach writer or drawing)", () => {
  assertEquals(usesFormAppearance(after), false);
  assertEquals(usesFormAppearance(null), false);
  const ap = mergeAppearance(formAppearanceFor(after, ariProfile), formAppearanceFor(after, ariProfile));
  assertEquals(hairToEnglish(ap), "");
  assertEquals(clothingToEnglish(ap, "male"), "");
});

Deno.test("older stories and their redraws keep the saved fields as before", () => {
  assertEquals(usesFormAppearance(before), true);
  const ap = mergeAppearance(null, formAppearanceFor(before, ariProfile));
  assert(hairToEnglish(ap).includes("blond"));
  assert(clothingToEnglish(ap, "male").length > 0);
});

Deno.test("no avatar = no story: a real photo alone is refused", () => {
  assertEquals(hasAvatarSource(null, null), false);
  assertEquals(hasAvatarSource("", { avatar_url: " " }), false);
  assertEquals(hasAvatarSource("data:image/png;base64,AAA", null), true);
  assertEquals(hasAvatarSource(null, { avatar_url: "https://x/a.png" }), true);
});

Deno.test("hero hair and hairstyle are removed from the scene", () => {
  const s = stripHeroHair("Ari Meir, a 4-year-old boy with blond hair, kneels by the crib. Mia with long brown hair in two pigtails waves.");
  assert(!/blond|hair|pigtail/i.test(s), s);
  assert(s.includes("kneels by the crib"));
  assertEquals(stripHeroHair("Ari, blond-haired, plays."), "Ari, plays.");
  assertEquals(stripHeroHair("Ari builds a tower."), "Ari builds a tower.");
});

Deno.test("drawing-style words are removed, objects in the scene stay", () => {
  assertEquals(stripStyleWords("Ari reads a book. Watercolor style, soft light."), "Ari reads a book. Soft light.");
  assert(!/2d|cartoon|watercolou?r|flat/i.test(stripStyleWords("Mia waves, 2D cartoon style, flat colors, in a soft watercolor illustration style.")));
  const objects = "Ari holds a crayon and draws a sketch on paper while watching a cartoon on TV.";
  assertEquals(stripStyleWords(objects), objects);
});

Deno.test("saved scenes: style words always go; short stories also lose hero hair and (without a request) hero clothes", () => {
  const raw = "Ari, with blond hair, in a red superhero costume, hugs baby Amri. Watercolor style.";
  const short = cleanSavedScene(raw, { short: true, requestedOutfit: null });
  assert(!/blond|costume|watercolor/i.test(short), short);
  assert(short.includes("hugs baby Amri"));
  const asked = cleanSavedScene(raw, { short: true, requestedOutfit: "a red superhero costume" });
  assert(asked.includes("costume") && !/blond|watercolor/i.test(asked), asked);
  const old = cleanSavedScene(raw, { short: false });
  assert(old.includes("blond") && old.includes("costume") && !/watercolor/i.test(old), old);
});

Deno.test("long instruction (older stories) also drops style words from the scene", () => {
  const p = buildIllustrationPrompt({ refs: { face: true, canon: false, canonPage: 1, leo: false }, hero: { gender: "male", age: 6 } as any, scene: "SCENE: Ari plays. Watercolor style.", rules: [], formatRule: "" } as any);
  assert(!/watercolor/i.test(p));
  assert(p.includes("Ari plays."));
});

Deno.test("short instruction: one short 'only these characters' line, no style words or hero hair", () => {
  assertEquals(onlyCharactersLine(["leo"]), "Only these characters appear: the main child, Leo and the people named in the scene — no other children.");
  const p = buildShortIllustrationPrompt({ scene: "Scene: Ari, with blond hair, kneels by baby Amri's crib. Watercolor style.", cast: [] });
  assert(p.includes("Only these characters appear: the main child and the people named in the scene — no other children."));
  assert(!/blond|watercolor/i.test(p));
  assert(p.split("\n\n").length <= 6, "short instruction stays short");
});

Deno.test("check: hair colour/length and extra children are asked and become hard problems", () => {
  const c = { outfit: null, cast: [] as any[], pageText: "ארי ליד העריסה של אמרי", scene: "Ari kneels by baby Amri's crib." };
  const q = clothesCheckQuestions("Image B", "Image A", c);
  assert(q.includes("hero_hair_ok") && q.includes("extra_child") && q.includes("baby Amri"));
  assert(CLOTHES_JSON_KEYS.includes('"hero_hair_ok":bool') && CLOTHES_JSON_KEYS.includes('"extra_child":bool'));
  assertEquals(clothesProblemsFrom({ hero_hair_ok: false, extra_child: true }, c), ["hero hair", "extra child"]);
  assert(hasHardProblem(["hero hair"]) && hasHardProblem(["extra child"]) && !hasHardProblem(["avatar face"]));
  assert(clothesFixInstruction(["extra child"]).includes("no other children"));
});

Deno.test("wrong hair or an extra child is never saved, not even page 1 as the closest try", () => {
  const tries = [{ problems: ["hero hair"] }, { problems: ["extra child", "avatar face"] }];
  assertEquals(redrawDecision(tries, { hadExisting: false, pageNumber: 1 }).action, "hold");
  assertEquals(keptTryAfterFailedRedraws(1, false, tries.map((t) => ({ ...t, reason: "x" }))), null);
  assertEquals(keptTryAfterFailedRedraws(3, false, [{ problems: ["hero hair", "avatar hair"], reason: "x" }]), null);
  // A try without a hard problem can still be page 1's closest.
  const d = redrawDecision([{ problems: ["hero hair"] }, { problems: ["avatar face"] }], { hadExisting: false, pageNumber: 1 });
  assertEquals(d.action === "save_closest" && d.index, 1);
});

Deno.test("writer: no hero hair, no style words, only the page's characters, same family all through", () => {
  for (const r of [HERO_CLOTHES_WRITER_RULE_HE, HERO_CLOTHES_WRITER_RULE_EN]) assert(r.length < 2000);
  assert(HERO_CLOTHES_WRITER_RULE_HE.includes("צבע שיער") && HERO_CLOTHES_WRITER_RULE_HE.includes("המשפחה קבועה"));
  assert(HERO_CLOTHES_WRITER_RULE_EN.includes("hair colour") && HERO_CLOTHES_WRITER_RULE_EN.includes("same number of siblings"));
});

Deno.test("Ari's saved scenes come out clean and readable", () => {
  const c = (x: string) => cleanSavedScene(x, { short: true, requestedOutfit: null });
  assertEquals(c("Ari Meir with loose flowing blond hair wearing his red superhero costume and a small kippah stands beside baby Imri's crib."),
    "Ari Meir with a small kippah stands beside baby Imri's crib.");
  assertEquals(c("Mother Rotem kneels beside Ari Meir who has loose flowing blond hair, wearing his red superhero costume and a small kippah, gently caressing his head."),
    "Mother Rotem kneels beside Ari Meir with a small kippah gently caressing his head.");
  assert(!/blond|costume|watercolor/i.test(c("Ari Meir, a cute toddler boy with loose flowing blond hair wearing a red superhero costume with a tiny cape and a small kippah on his head, stands proudly. Soft watercolor children's book style.")));
});
