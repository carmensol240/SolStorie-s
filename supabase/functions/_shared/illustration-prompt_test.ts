import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildIllustrationPrompt, referenceContent, referenceOrdinals } from "./illustration-prompt.ts";

const hero = { gender: "male", ageText: "4", outfit: "a green winter coat, a green scarf and jeans", traits: { hair: "near-black very dark brown" as const, eyes: "brown", skin: "light warm" } };
const scene = "SCENE: Uriel builds a tower of wooden blocks in a cozy room.";

Deno.test("with an avatar the face paragraph is the very first thing in the request", () => {
  const p = buildIllustrationPrompt({ refs: { face: true, canon: true, canonPage: 1, leo: false }, hero, scene });
  assert(p.startsWith("FACE — THE MOST IMPORTANT RULE. The FIRST image is the child's face reference picture and the ONLY source"));
  assert(p.indexOf("FACE —") < p.indexOf("PAGE REFERENCE") && p.indexOf("PAGE REFERENCE") < p.indexOf("STYLE:"));
});

Deno.test("page 1 is used only for clothes and style, with an explicit 'do not copy the face'", () => {
  const p = buildIllustrationPrompt({ refs: { face: true, canon: true, canonPage: 1, leo: false }, hero, scene });
  assert(p.includes("The SECOND image is page 1 of this same book. Use it ONLY for the clothes"));
  assert(p.includes("Do NOT copy the face, hair or age from it"));
  assert(!p.includes("IDENTITY LOCK"));
});

Deno.test("real age and avatar traits are written inside the face paragraph; text hair is never sent with a face picture", () => {
  const p = buildIllustrationPrompt({ refs: { face: true, canon: false, leo: false }, hero: { ...hero, lookText: "light blonde hair" }, scene });
  const face = p.slice(0, p.indexOf("\n\nSTYLE:"));
  assert(face.includes("exactly 4 years old (not younger, not older)"));
  assert(face.includes("hair near-black very dark brown, eyes brown"));
  assert(!p.includes("light blonde"));
});

Deno.test("all other rules are one RULES block that keeps outfit, gender, single hero and no-flags", () => {
  const p = buildIllustrationPrompt({ refs: { face: true, canon: true, leo: false }, hero, scene, rules: ["CAST CHARACTER REFERENCE: x"] });
  assertEquals(p.split("RULES (all apply):").length, 2);
  const rules = p.slice(p.indexOf("RULES (all apply):"), p.indexOf("NEGATIVE:"));
  for (const want of ["exactly a green winter coat, a green scarf and jeans", "Boy:", "exactly once", "foreign flags", "CAST CHARACTER REFERENCE"]) assert(rules.includes(want), want);
  assert(p.includes("Pixar 3D animation style"));
});

Deno.test("without a face picture the page reference carries the identity and text look is used", () => {
  const p = buildIllustrationPrompt({ refs: { face: false, canon: true, leo: false }, hero: { ...hero, lookText: "short black hair" }, scene });
  assert(p.startsWith("CHARACTER REFERENCE: The FIRST image is page 1"));
  assert(p.includes("Look: short black hair."));
});

Deno.test("pictures are always attached face, page reference, Leo — the order the text names", () => {
  assertEquals(referenceOrdinals({ face: true, canon: true, leo: true }), { face: 1, canon: 2, leo: 3 });
  const c = referenceContent({ face: "data:a", canon: "https://p1", leo: "https://leo" }, "PROMPT");
  assertEquals(c.map((x: any) => x.image_url?.url ?? x.text.slice(0, 22)), ["data:a", "https://p1", "https://leo", "LEO REFERENCE (THIRD I", "PROMPT"]);
});

Deno.test("likeness: distinguishing features are inside the face paragraph", async () => {
  const { buildIllustrationPrompt } = await import("./illustration-prompt.ts");
  const prompt = buildIllustrationPrompt({ refs: { face: true, canon: true, leo: false }, hero: { gender: "male", ageText: "4", features: ["wide square face", "short hair brushed forward, no bangs", "slightly protruding ears"] }, scene: "SCENE: x" });
  const face = prompt.slice(0, prompt.indexOf("\n\nPAGE REFERENCE"));
  for (const f of ["wide square face", "no bangs", "protruding ears"]) if (!face.includes(f)) throw new Error(`missing ${f}`);
});
Deno.test("likeness: avatar analysis keeps 3-8 clean features", async () => {
  const { parseAvatarTraits } = await import("./avatar-traits.ts");
  const t = parseAvatarTraits('{"hair_shade":"near-black very dark brown","eye_color":"brown","skin_tone":"fair","distinct_features":["wide face","thick straight eyebrows","short cropped sides","small nose"]}');
  if (t?.features?.length !== 4 || t.hair !== "near-black very dark brown") throw new Error(JSON.stringify(t));
});
