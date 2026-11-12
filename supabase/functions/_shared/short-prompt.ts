// Short drawing instruction for new stories (SHORT_PROMPT_CUTOFF) whose face picture is the child's avatar.
// The experiment of 12-11-2026 showed that a short request that starts with the avatar line keeps the
// child far closer to the avatar than the long rule list. So the request holds only: the avatar line,
// the scene, the clothes, the gang (one line each, Leo by his reference picture), the shape and
// "warm light, waist-up, no text, no letters, no flags". Every other rule is enforced by the checks
// after the drawing (3D style, face vs avatar, shape, text, flags and the clothes questions below).
// Older stories and their redraws keep buildIllustrationPrompt (illustration-prompt.ts).
import { CAST_DESCRIPTIONS } from "./style-config.ts";

export type ShortCastKey = keyof typeof CAST_DESCRIPTIONS;

export const SHORT_PROMPT_CUTOFF = "2026-11-12T08:45:00Z";

/** Short instruction only for stories created from SHORT_PROMPT_CUTOFF and drawn from the avatar. */
export function usesShortPrompt(createdAt: string | null | undefined, faceIsAvatar: boolean): boolean {
  if (!faceIsAvatar || !createdAt) return false;
  const t = Date.parse(createdAt);
  return !Number.isNaN(t) && t >= Date.parse(SHORT_PROMPT_CUTOFF);
}

export const AVATAR_LINE =
  "This is the child's avatar. Create a children's book illustration of EXACTLY this same child — same face, same hair, same eyes, same face shape — in the same 3D style as the avatar.";
export const AVATAR_CLOTHES_LINE =
  "The child wears exactly the clothes from the avatar. Gang characters wear only their own official clothes — never the child's clothes.";
export const PLOT_CLOTHES_LINE =
  "Other clothes for the main child apply only when this page's story text has the child change clothes (e.g. pajamas at bedtime).";

/** Clothes the parent asked for in the free text (saved once in stories.story_outfit). */
export function requestedClothesLine(outfit: string): string {
  return `The child wears ${outfit}. These clothes belong ONLY to the main child. Gang characters wear only their own official clothes — never the child's clothes.`;
}

const ORD = ["", "first", "second", "third", "fourth"];
const NAME: Record<ShortCastKey, string> = { sol: "Sol", ben: "Ben", mia: "Mia", zoe: "Zoe", leo: "Leo" };

/** Official clothes of each gang member, short (used in the clothes check). */
export const GANG_CLOTHES: Record<ShortCastKey, string> = {
  sol: "red cape, light blue t-shirt with a golden star, purple pants",
  ben: "green t-shirt",
  mia: "green dress and a small flower crown",
  zoe: "purple-yellow sporty tracksuit and a light blue headband",
  leo: "red-yellow striped t-shirt under blue denim overalls, round glasses",
};

/** One line per gang member on this page; Leo by his reference picture when it is attached. */
export function castLines(cast: ShortCastKey[], leoImage: number | null): string[] {
  return cast.map((k) => k === "leo" && leoImage
    ? `Leo: exactly as in the ${ORD[leoImage]} image (his official look and clothes) — a friend, not the main child.`
    : `${NAME[k]}: ${CAST_DESCRIPTIONS[k]}`);
}

export function shortShape(format: string | null | undefined): string {
  if (format === "square") return "Square 1:1 image";
  if (format === "portrait") return "Tall 2:3 portrait image";
  return "Wide 3:2 landscape image";
}

export interface ShortPromptInput {
  /** Scene: the page's visual description plus its story text (meaning only). */
  scene: string;
  /** Clothes the parent asked for (stories.story_outfit); empty = the avatar's clothes. */
  requestedOutfit?: string | null;
  kippah?: boolean;
  kippahColor?: string;
  cast?: ShortCastKey[];
  /** Position of Leo's reference picture (the avatar is always the first image). */
  leoImage?: number | null;
  /** Page-specific must-haves (learning letter, IDF uniform of a family member). */
  extra?: string[];
  format?: string | null;
  /** Letter/number stories: the one learning element is the only writing allowed. */
  learningTarget?: string | null;
  /** Correction after a failed check. */
  fix?: string;
}

export function buildShortIllustrationPrompt(input: ShortPromptInput): string {
  const lines: string[] = [AVATAR_LINE, input.scene.trim()];
  const outfit = String(input.requestedOutfit || "").trim();
  lines.push(outfit ? requestedClothesLine(outfit) : AVATAR_CLOTHES_LINE);
  lines.push(PLOT_CLOTHES_LINE);
  if (input.kippah) lines.push(`The child wears a small knitted ${input.kippahColor || "dark blue"} kippah on the head (hair visible).`);
  lines.push(...castLines(input.cast || [], input.leoImage ?? null));
  lines.push(...(input.extra || []).map((x) => x.trim()).filter(Boolean));
  if (input.fix?.trim()) lines.push(input.fix.trim());
  const noText = input.learningTarget
    ? `no text and no letters except the ${input.learningTarget}`
    : "no text, no letters";
  lines.push(`${shortShape(input.format)}, warm light, waist-up, ${noText}, no flags.`);
  return lines.join("\n\n");
}

/** Chat content for the short request: avatar first, then Leo's picture, then the text. */
export function shortReferenceContent(avatar: string, leoUrl: string | null, prompt: string): any[] {
  const out: any[] = [{ type: "image_url", image_url: { url: avatar } }];
  if (leoUrl) out.push({ type: "image_url", image_url: { url: leoUrl } });
  out.push({ type: "text", text: prompt });
  return out;
}

// ─── Checks after the drawing ───

export interface ClothesCheck {
  /** Clothes the parent asked for; null/empty = the avatar's clothes. */
  outfit?: string | null;
  cast: ShortCastKey[];
  /** The page's story text without nikud (lets a plot change of clothes pass). */
  pageText?: string;
}

/** Clothes + flag questions. `page` / `avatar` name the pictures, e.g. "Image B" / "Image A". */
export function clothesCheckQuestions(page: string, avatar: string, c: ClothesCheck): string {
  const outfit = String(c.outfit || "").trim();
  const text = String(c.pageText || "").replace(/[\u0591-\u05C7]/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
  let q = `- hero_clothes_ok: does the main child in ${page} wear ${outfit ? `"${outfit}"` : `the same clothes as in ${avatar} (same garments and colors)`}? ` +
    `true also when this page's story text has the child in other clothes (e.g. pajamas at bedtime)${text ? `. Story text (meaning only): "${text}"` : ""}. Ignore clothes hidden by framing.\n`;
  if (c.cast.length) {
    q += `- gang_clothes_ok: does each of these characters in ${page} wear only their own official clothes — ${c.cast.map((k) => `${NAME[k]}: ${GANG_CLOTHES[k]}`).join("; ")} — and none of them wears the main child's clothes? true for a character who is not visible.\n`;
  }
  q += `- foreign_flag: is there any flag other than Israel's (blue star of David on white), or a stars-and-stripes pattern, anywhere in ${page}?\n`;
  return q;
}

export const HERO_CLOTHES_PROBLEM = "hero clothes";
export const GANG_CLOTHES_PROBLEM = "gang clothes";
export const FLAG_PROBLEM = "foreign flag";

export function clothesProblemsFrom(p: Record<string, unknown>, c: ClothesCheck): string[] {
  const out: string[] = [];
  if (p.hero_clothes_ok === false) out.push(HERO_CLOTHES_PROBLEM);
  if (c.cast.length && p.gang_clothes_ok === false) out.push(GANG_CLOTHES_PROBLEM);
  if (p.foreign_flag === true) out.push(FLAG_PROBLEM);
  return out;
}

export function clothesFixInstruction(problems: string[], outfit?: string | null): string {
  const o = String(outfit || "").trim();
  const parts: string[] = [];
  if (problems.includes(HERO_CLOTHES_PROBLEM)) {
    parts.push(o ? `the main child wears ${o} — these clothes belong ONLY to the main child` : "the main child wears exactly the clothes from the avatar");
  }
  if (problems.includes(GANG_CLOTHES_PROBLEM)) parts.push("gang characters wear only their own official clothes — never the main child's clothes");
  if (problems.includes(FLAG_PROBLEM)) parts.push("no flags at all except Israel's, no stars-and-stripes anywhere");
  return parts.length ? `CLOTHES FIX (the previous attempt was wrong): ${parts.join("; ")}.` : "";
}

// ─── Clothes asked for in the parent's free text (detected once in generate-story) ───

const CLOTHES_WORDS = /(לבוש|לובש|לובשת|תלביש|להלביש|מלביש|תחפוש|מחופש|מתחפש|תלבושת|חולצ|שמלה|שמלת|מכנס|גלימ|כובע|בגד|נעלי|סרבל|פיג'מה|פיגמה|מדים|חליפ|wear|dress|outfit|costume|shirt|cape|uniform|hat|pajama|clothes)/i;

/** Cheap pre-filter: only text with a clothing word goes to the AI question. */
export function mayRequestClothes(text: string | null | undefined): boolean {
  return CLOTHES_WORDS.test(String(text || ""));
}

export const OUTFIT_REQUEST_QUESTION =
  "A parent wrote this request for a personalized children's book. Did the parent explicitly ask how the MAIN CHILD should be dressed in the book's pictures " +
  "(for example 'dress him as a superhero', 'she wears her Maccabi shirt', 'in a princess costume')? " +
  "Clothes that belong to one moment of the plot (pajamas at bedtime, a swimsuit at the pool) or clothes of other characters do NOT count. " +
  'Return strict JSON only: {"outfit": "<short English description of the requested clothes/costume, or empty string>"}';

/** Cleans the detected outfit: short English words only, else null. */
export function parseOutfitRequest(raw: string): string | null {
  try {
    const t = String(raw || "").replace(/```json|```/g, "");
    const p = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    const o = String(p.outfit ?? "").replace(/[^a-zA-Z0-9 ,\-'/]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
    return o.length >= 3 ? o : null;
  } catch { return null; }
}

/** One AI question (only when the text has a clothing word); null on no request or any failure. */
export async function detectRequestedOutfit(text: string, apiKey: string): Promise<string | null> {
  const t = String(text || "").trim().slice(0, 1500);
  if (!t || !mayRequestClothes(t)) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3.8-flash", messages: [{ role: "user", content: `${OUTFIT_REQUEST_QUESTION}\n\nParent's text:\n"""${t}"""` }] }),
    });
    if (!res.ok) { await res.text().catch(() => ""); return null; }
    return parseOutfitRequest((await res.json())?.choices?.[0]?.message?.content ?? "");
  } catch (e) {
    console.warn("[OUTFIT-REQUEST] detection failed:", (e as Error)?.message);
    return null;
  }
}
