import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  AVATAR_CLOTHES_LINE, AVATAR_LINE, SHORT_PROMPT_CUTOFF, buildShortIllustrationPrompt, clothesCheckQuestions,
  clothesFixInstruction, clothesProblemsFrom, mayRequestClothes, parseOutfitRequest, shortReferenceContent, stripHeroClothes, usesShortPrompt,
} from "./short-prompt.ts";
import { redrawFixInstruction } from "./style-check.ts";
import { isLookOnly, lookFixInstruction } from "./look-check.ts";

const scene = "Scene: the child builds a tall tower of wooden blocks in a cozy room.";

Deno.test("short instruction only for stories created from the new cutoff and drawn from the avatar", () => {
  const after = new Date(Date.parse(SHORT_PROMPT_CUTOFF) + 60_000).toISOString();
  const before = new Date(Date.parse(SHORT_PROMPT_CUTOFF) - 60_000).toISOString();
  assertEquals(usesShortPrompt(after, true), true);
  assertEquals(usesShortPrompt(before, true), false); // existing stories and their redraws stay unchanged
  assertEquals(usesShortPrompt(after, false), false); // a real photo never gets the short instruction
  assertEquals(usesShortPrompt(null, true), false);
});

Deno.test("an older story uses the short instruction only with its own admin opt-in (hero_short_prompt), and only with an avatar", () => {
  const before = new Date(Date.parse(SHORT_PROMPT_CUTOFF) - 86_400_000).toISOString();
  assertEquals(usesShortPrompt(before, true, true), true);
  assertEquals(usesShortPrompt(before, true, false), false);
  assertEquals(usesShortPrompt(before, true, null), false);
  assertEquals(usesShortPrompt(before, true, "true"), false); // only a real boolean switches it on
  assertEquals(usesShortPrompt(before, false, true), false); // never without the avatar as face picture
});

Deno.test("the request starts with the avatar line, then the scene, and ends with shape + warm light + no text/flags", () => {
  const p = buildShortIllustrationPrompt({ scene, format: "landscape" });
  assert(p.startsWith("This is the child's avatar. Create a children's book illustration of EXACTLY this same child — same face, same hair, same eyes, same face shape — in the same 3D style as the avatar."));
  assertEquals(p.indexOf(scene), AVATAR_LINE.length + 2);
  assert(p.endsWith("Wide 3:2 landscape image, warm light, waist-up, no text, no letters, no flags."));
  assert(buildShortIllustrationPrompt({ scene, format: "square" }).endsWith("Square 1:1 image, warm light, waist-up, no text, no letters, no flags."));
  for (const longRule of ["FACE —", "RULES (all apply)", "NEGATIVE:", "PAGE REFERENCE", "STYLE:"]) assert(!p.includes(longRule), longRule);
});

Deno.test("by default the child wears the avatar's clothes and the gang never wears them", () => {
  const p = buildShortIllustrationPrompt({ scene });
  assert(p.includes("The child wears exactly the clothes from the avatar. Gang characters wear only their own official clothes — never the child's clothes."));
  assert(p.includes("pajamas at bedtime"));
});

Deno.test("clothes the parent asked for replace the avatar's clothes and belong only to the main child", () => {
  const p = buildShortIllustrationPrompt({ scene, requestedOutfit: "a blue superhero suit with a red cape" });
  assert(p.includes("The child wears a blue superhero suit with a red cape. These clothes belong ONLY to the main child."));
  assert(!p.includes(AVATAR_CLOTHES_LINE));
});

Deno.test("one line per gang member; Leo by his reference picture (second image after the avatar)", () => {
  const p = buildShortIllustrationPrompt({ scene, cast: ["leo", "mia"], leoImage: 2 });
  assert(p.includes("Leo: exactly as in the second image (his official look and clothes) — a friend, not the main child."));
  assertEquals(p.split("\n\n").filter((l) => l.startsWith("Mia: ")).length, 1);
  assertEquals(shortReferenceContent("data:avatar", "https://leo", "P").map((x: any) => x.image_url?.url ?? x.text), ["data:avatar", "https://leo", "P"]);
});

Deno.test("kippah stays as chosen in the form; girls/no kippah get no kippah line", () => {
  assert(buildShortIllustrationPrompt({ scene, kippah: true, kippahColor: "white" }).includes("small knitted white kippah"));
  assert(!buildShortIllustrationPrompt({ scene }).includes("kippah"));
});

Deno.test("letter stories: the learning letter is the only writing allowed", () => {
  const p = buildShortIllustrationPrompt({ scene, learningTarget: "Hebrew letter A" });
  assert(p.endsWith("no text and no letters except the Hebrew letter A, no flags."));
});

Deno.test("clothes check: wrong hero clothes, gang in the child's clothes and a foreign flag are problems", () => {
  const c = { outfit: null, cast: ["leo" as const] };
  assertEquals(clothesProblemsFrom({ hero_clothes_ok: false, gang_clothes_ok: false, foreign_flag: true }, c), ["hero clothes", "gang clothes", "foreign flag"]);
  assertEquals(clothesProblemsFrom({ hero_clothes_ok: true, gang_clothes_ok: false, foreign_flag: false }, { outfit: null, cast: [] }), []);
  const q = clothesCheckQuestions("Image B", "Image A", { outfit: null, cast: ["leo"], pageText: "שָׁלוֹם" });
  assert(q.includes("the same clothes as in Image A") && q.includes("Leo: red-yellow striped t-shirt") && q.includes("שלום"));
  assert(clothesCheckQuestions("B", "A", { outfit: "a pirate costume", cast: [] }).includes('"a pirate costume"'));
});

Deno.test("clothes failures get a corrected redraw (look problems: one redraw, never an empty page)", () => {
  const fix = redrawFixInstruction(["hero clothes", "gang clothes"], { clothesOutfit: null });
  assert(fix.includes("the main child wears exactly the clothes from the avatar"));
  assert(fix.includes("never the main child's clothes"));
  assert(clothesFixInstruction(["hero clothes"], "a pirate costume").includes("a pirate costume — these clothes belong ONLY to the main child"));
  assert(clothesFixInstruction(["foreign flag"]).includes("no flags at all except Israel's"));
  assertEquals(isLookOnly(["hero clothes", "avatar face"]), true);
  assertEquals(isLookOnly(["foreign flag"]), false);
  assertEquals(lookFixInstruction(["hero clothes"], ""), "");
  assertEquals(redrawFixInstruction(["text in image"]), "TEXT FIX: no letters, words, captions or signs anywhere in the picture.");
});

Deno.test("free-text clothes request: pre-filter and clean answer", () => {
  assertEquals(mayRequestClothes("תלבישו אותו כגיבור-על"), true);
  assertEquals(mayRequestClothes("סיפור על ים וחברים"), false);
  assertEquals(parseOutfitRequest('```json\n{"outfit":"a superhero costume with a red cape"}\n```'), "a superhero costume with a red cape");
  assertEquals(parseOutfitRequest('{"outfit":""}'), null);
  assertEquals(parseOutfitRequest("not json"), null);
});

// Real scenes the writer produced for Ari (1258dee1) and Sol (c4532152) without any parent clothes request.
const ariScene = "Ari Meir with loose blond hair in his red superhero costume and a small kippah nestled happily on the soft couch between mom Rotem and dad Bar.";
const ariScene1 = "Ari Meir, a cute toddler boy, wearing a red superhero costume with a tiny cape and a small kippah on his head, stands proudly.";
const solScene = "Sol is wearing a bright yellow t-shirt with a small smiling sun print and soft blue cotton pants. Sol is sitting on a fluffy green rug.";
const solScene5 = "Sol, wearing her bright yellow t-shirt with a small smiling sun print and soft blue cotton pants, stands happily near the open front door.";

Deno.test("no parent clothes request: the writer's hero clothes never reach the drawing", () => {
  for (const sc of [ariScene, ariScene1, solScene, solScene5]) {
    const out = stripHeroClothes(sc);
    for (const word of ["costume", "cape", "t-shirt", "pants", "print"]) assert(!out.toLowerCase().includes(word), `${word} in: ${out}`);
    const p = buildShortIllustrationPrompt({ scene: `Scene: ${sc}` });
    assert(!/costume|cape|t-shirt/i.test(p.split(AVATAR_CLOTHES_LINE)[0]), p);
    assert(p.includes(AVATAR_CLOTHES_LINE));
  }
  // the action, the place, the kippah and the other characters stay
  assert(stripHeroClothes(ariScene).includes("small kippah nestled happily on the soft couch between mom Rotem and dad Bar"));
  assert(stripHeroClothes(solScene).includes("Sol is sitting on a fluffy green rug."));
  assert(stripHeroClothes(solScene5).includes("stands happily near the open front door"));
  // a scene without clothes is not touched
  assertEquals(stripHeroClothes(scene), scene);
  assertEquals(stripHeroClothes("Ari sits in the living room near the coat rack."), "Ari sits in the living room near the coat rack.");
});

Deno.test("with a parent clothes request (story_outfit) the scene keeps the requested costume", () => {
  const p = buildShortIllustrationPrompt({ scene: `Scene: ${ariScene}`, requestedOutfit: "a red superhero costume with a cape" });
  assert(p.includes("in his red superhero costume"));
  assert(p.includes("These clothes belong ONLY to the main child."));
});
