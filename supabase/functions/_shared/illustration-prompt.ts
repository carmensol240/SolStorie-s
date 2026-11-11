// One drawing instruction for every story picture: first drawings (generate-illustrations),
// redraws (retry-illustration), the backup service and toddler second pictures all call
// buildIllustrationPrompt. Order of the request:
//   1. FACE — the child's face reference picture is the ONLY source for the face (strong paragraph first).
//   2. Page reference (usually page 1) — only clothes and 3D render style, never the face.
//   3. STYLE (Pixar 3D), 4. SCENE, 5. one short RULES block, 6. fix after a failed check, 7. NEGATIVE.
// Reference pictures are always attached in the same order: face, page reference, Leo.
import { PIXAR_STYLE, leoRefNote, negativePromptFor } from "./style-config.ts";
import { featuresLine, type AvatarTraits } from "./avatar-traits.ts";

export interface PromptRefs {
  /** The child's face reference picture (avatar; the real photo only when there is no avatar). */
  face: boolean;
  /** A finished page of the same book (usually page 1). */
  canon: boolean;
  canonPage?: number;
  /** Leo's official picture (Leo named on the page). */
  leo: boolean;
}

export interface PromptHero {
  gender?: string | null;
  /** "4" (real age → "exactly") or an age range such as "3-5". */
  ageText?: string;
  outfit?: string;
  kippah?: boolean;
  kippahColor?: string;
  glasses?: boolean;
  /** Text-only look (hair/skin/eyes). Used ONLY when there is no face picture. */
  lookText?: string;
  /** Hair/eyes/skin read from the avatar (new stories) — written inside the face paragraph. */
  traits?: AvatarTraits | null;
  /** Distinguishing features read from the avatar (LIKENESS_CUTOFF stories). */
  features?: string[] | null;
}

export interface IllustrationPromptInput {
  refs: PromptRefs;
  hero: PromptHero;
  scene: string;
  /** Page-specific rules (cast, army uniform, learning element). */
  rules?: string[];
  formatRule?: string;
  /** Correction after a failed check. */
  fix?: string;
}

const ORD = ["", "FIRST", "SECOND", "THIRD", "FOURTH"];

/** Position (1-based) of each attached picture; pictures are always sent face → page reference → Leo. */
export function referenceOrdinals(refs: Pick<PromptRefs, "face" | "canon" | "leo">): { face: number | null; canon: number | null; leo: number | null } {
  let n = 0;
  const face = refs.face ? ++n : null;
  const canon = refs.canon ? ++n : null;
  const leo = refs.leo ? ++n : null;
  return { face, canon, leo };
}

function isGirl(g?: string | null) { return String(g || "").toLowerCase() === "female"; }

export function ageWords(ageText?: string): string {
  const a = String(ageText || "").trim();
  if (!a) return "";
  return /^\d+$/.test(a) ? `exactly ${a} years old (not younger, not older)` : `about ${a} years old`;
}

/** The face paragraph — always the first thing in the request when a face picture is attached. */
export function faceBlock(n: number, hero: PromptHero): string {
  const img = `the ${ORD[n]} image`;
  const age = ageWords(hero.ageText);
  const t = hero.traits;
  return `FACE — THE MOST IMPORTANT RULE. ${cap(img)} is the child's face reference picture and the ONLY source for the main child's face.
The main child must be instantly recognizable as the exact child in ${img}, drawn as the same Pixar-style 3D character. Copy it feature by feature: face shape and jawline, cheeks and chin, eye shape, size, spacing and color, eyebrows, nose, mouth and smile, ears, skin tone, freckles or marks, hair color, hair length, hairline, parting and hairstyle${age ? `, and the age: ${age}` : ""}.${t ? ` As seen in ${img}: hair ${t.hair}, eyes ${t.eyes}, skin ${t.skin}.` : ""}${featuresLine(hero.features) ? ` ${featuresLine(hero.features)}` : ""}
Do not beautify, idealize, slim, age up or down, or make the face generic; do not restyle the hair. If anything else in this request (scene text, rules or another image) disagrees about the face, hair, eyes, skin or age, ${img} wins. Only the clothes, pose, expression and scene change.`;
}

/** The page reference: with a face picture it carries only clothes + render style. */
export function canonBlock(n: number, page: number, hasFace: boolean): string {
  const img = `the ${ORD[n]} image`;
  if (hasFace) {
    return `PAGE REFERENCE: ${cap(img)} is page ${page} of this same book. Use it ONLY for the clothes (same garments and colors) and the polished 3D render style (lighting, skin shading, materials). Do NOT copy the face, hair or age from it — those come only from the face reference picture. Do not copy its composition, pose, camera angle or background.`;
  }
  return `CHARACTER REFERENCE: ${cap(img)} is page ${page} of this same book and shows the same main child. Reproduce the child exactly as shown: same face, hair color, length and texture, eye color, apparent age, skin tone, clothes and 3D render style. Do not copy its composition, pose, camera angle or background.`;
}

/** All fixed rules in one short block. */
export function rulesBlock(hero: PromptHero, hasFace: boolean, extra: string[] = []): string {
  const girl = isGirl(hero.gender);
  const kid = girl ? "girl" : "boy";
  const age = String(hero.ageText || "").trim();
  const kippah = !girl && !!hero.kippah;
  const head = kippah
    ? `a small knitted ${hero.kippahColor || "dark blue"} kippah on the head on every page (hair visible)`
    : "uncovered head, hair visible";
  const lines: string[] = [];
  lines.push(`- Main child: a ${age ? `${age}-year-old ` : ""}${kid}${hero.glasses ? " wearing glasses" : ""}, ${head}${hero.outfit ? `, wearing ${hero.outfit}` : ""}.${!hasFace && hero.lookText ? ` Look: ${hero.lookText}.` : ""}`);
  if (hero.outfit) lines.push(`- Outfit (same on every page): exactly ${hero.outfit}. It overrides clothes in the scene text and in every reference picture. No cape or costume unless listed.`);
  lines.push(girl
    ? "- Girl: no kippah, tzitzit, sidelocks or any religious head covering or symbol."
    : "- Boy: masculine clothes and a boy's hairstyle only; no dress, skirt, tutu, bows, flower crown, makeup or feminine jewelry.");
  lines.push(`- Religious items: ${kippah ? "only the kippah above" : "none on the main child"} — never tzitzit, sidelocks, veil or cross; holiday symbols only as objects in the scene.`);
  lines.push("- The main child appears exactly once (no twin, clone, mirror copy or lookalike). Companions named in the story text are welcome and look clearly different.");
  lines.push("- No US or other foreign flags and no foreign military insignia anywhere (walls, photos, clothes, objects); the only allowed flag is Israel's. Any soldier wears only the IDF olive uniform.");
  lines.push("- Same face, hair, eyes, skin and outfit as on every other page of the book.");
  return `RULES (all apply):\n${lines.join("\n")}${extra.filter(Boolean).length ? `\n\n${extra.filter(Boolean).join("\n\n")}` : ""}`;
}

export function buildIllustrationPrompt(input: IllustrationPromptInput): string {
  const ord = referenceOrdinals(input.refs);
  const parts: string[] = [];
  if (ord.face) parts.push(faceBlock(ord.face, input.hero));
  if (ord.canon) parts.push(canonBlock(ord.canon, input.refs.canonPage ?? 1, !!ord.face));
  if (!ord.face && !ord.canon) parts.push("NO REFERENCE PICTURE: create the main child exactly from the RULES description below and keep this look.");
  parts.push(`STYLE: ${PIXAR_STYLE}`);
  parts.push(input.scene.trim());
  parts.push(rulesBlock(input.hero, !!ord.face, input.rules));
  if (input.fix?.trim()) parts.push(input.fix.trim());
  if (input.formatRule?.trim()) parts.push(input.formatRule.trim());
  parts.push(`NEGATIVE: ${negativePromptFor(input.hero.gender)}`);
  return parts.join("\n\n");
}

/** Chat content: pictures in the fixed order (face, page reference, Leo + note), then the prompt. */
export function referenceContent(urls: { face?: string | null; canon?: string | null; leo?: string | null }, prompt: string): any[] {
  const ord = referenceOrdinals({ face: !!urls.face, canon: !!urls.canon, leo: !!urls.leo });
  const out: any[] = [];
  if (urls.face) out.push({ type: "image_url", image_url: { url: urls.face } });
  if (urls.canon) out.push({ type: "image_url", image_url: { url: urls.canon } });
  if (urls.leo && ord.leo) {
    out.push({ type: "image_url", image_url: { url: urls.leo } });
    out.push({ type: "text", text: leoRefNote(ORD[ord.leo]) });
  }
  out.push({ type: "text", text: prompt });
  return out;
}

/** Share of the request that is about the face (for logs and reports). */
export function faceShare(prompt: string): number {
  const start = prompt.indexOf("FACE — THE MOST IMPORTANT RULE");
  if (start < 0) return 0;
  const end = prompt.indexOf("\n\n", start);
  const len = (end < 0 ? prompt.length : end) - start;
  return Math.round((len / prompt.length) * 100);
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
