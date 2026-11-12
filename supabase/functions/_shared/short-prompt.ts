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

/** Short instruction for avatar-drawn stories created from SHORT_PROMPT_CUTOFF, or an older story's own admin opt-in (stories.hero_short_prompt). */
export function usesShortPrompt(createdAt: string | null | undefined, faceIsAvatar: boolean, optIn: unknown = false): boolean {
  if (!faceIsAvatar) return false;
  if (optIn === true) return true;
  if (!createdAt) return false;
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

// ─── No invented costume for the hero ───
// Without a parent request (story_outfit empty) the hero always wears the avatar's clothes, so clothing
// written by the story writer into a scene is removed before it reaches the drawing. Cast clothes come
// from their own lines; a plot change of clothes (pajamas) still reaches the model through the page text.

const GARMENT = "(?:costume|outfit|uniform|suit|cape|capes|clothes|clothing|t-shirt|tshirt|shirt|tee|top|pants|trousers|jeans|shorts|dress|skirt|overalls|jacket|coat|sweater|hoodie|vest|tracksuit|pajamas|pyjamas|onesie|gown|robe|mask|boots|sneakers|shoes|gloves|belt|emblem|logo|print|sleeves)";
const W = "[A-Za-z'-]+";
const PIECE = `(?:(?:a|an|his|her|their|the|matching)\\s+)?(?:${W}\\s+){0,6}?${GARMENT}\\b`;
const MORE = `(?:,?\\s+(?:with|and)\\s+${PIECE})*`;
const WEAR_SENTENCE = new RegExp(`(^|[.!?]\\s+)[^.!?\\n]*?\\b(?:is|are)\\s+(?:wearing|dressed (?:up )?(?:in|as))\\b[^.!?\\n]*[.!?]`, "gi");
const WEAR_PHRASE = new RegExp(`,?\\s*\\b(?:who is\\s+|is\\s+)?(?:wearing|dressed (?:up )?(?:in|as)|clad in)\\s+${PIECE}${MORE}`, "gi");
const ADJ = "(?!(?:near|by|next|beside|on|at|with|under|behind|of|to|and|in|from|room|house|garden|yard|park)\\b)[A-Za-z'-]+";
const IN_PHRASE = new RegExp(`,?\\s*\\bin\\s+(?:a|an|his|her|their|the)\\s+(?:${ADJ}\\s+){0,5}?${GARMENT}\\b${MORE}`, "gi");
const WITH_PHRASE = new RegExp(`,?\\s*\\bwith\\s+(?:a|an|his|her|their)\\s+(?:${W}\\s+){0,4}?(?:cape|mask|costume|emblem)\\b`, "gi");

/** Removes clothing descriptions from the writer's scene text (English). Text without clothes is returned unchanged. */
export function stripHeroClothes(scene: string): string {
  const src = String(scene || "");
  let s = src.replace(WEAR_SENTENCE, "$1").replace(WEAR_PHRASE, "").replace(IN_PHRASE, "").replace(WITH_PHRASE, "");
  if (s === src) return src;
  s = s.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").replace(/,\s*,/g, ",").replace(/,([.;!?])/g, "$1")
    .replace(/(^|\n)\s*[,;]\s*/g, "$1").replace(/([A-Za-z]),(\s+(?:sits|stands|runs|looks|is|gently|happily|smiles))/g, "$1$2");
  return s.trim();
}

// ─── Hair and drawing style come only from the avatar ───
// The writer sometimes adds a hair colour/hairstyle or a drawing style ("watercolor", "2D") to the scene.
// Hair always comes from the avatar, and every picture is 3D (locked rule 4), so both are removed.

const HAIR_ADJ = "(?:loose|flowing|fine|voluminous|bouncy|layered|cropped|buzzed|slightly|very|long|short|shoulder-length|chin-length|medium-length|curly|wavy|straight|messy|tousled|spiky|fluffy|thick|silky|shiny|soft|neat|light|dark|bright|pale|golden|platinum|sandy|honey|strawberry|dirty|ash|jet|jet-black|blond|blonde|brown|black|red|ginger|auburn|brunette|chestnut|copper|caramel|reddish|light-brown|dark-brown)";
const HAIR_TAIL = "(?:\\s+(?:in|with|tied in|pulled into|styled in)\\s+(?:a|an|two|his|her)?\\s*(?:[A-Za-z'-]+\\s+){0,2}?(?:ponytails?|pigtails?|braids?|buns?|bangs|curls|fringe))?";
const WHO_HAS_HAIR = new RegExp(`,?\\s*\\bwho\\s+has\\s+(?:(?:a|his|her)\\s+)?(?:${HAIR_ADJ}[\\s,-]+(?:and\\s+)?){1,5}hair\\b${HAIR_TAIL}`, "gi");
const WITH_HAIR_AND = new RegExp(`\\b(with|has)\\s+(?:(?:a|his|her)\\s+)?(?:${HAIR_ADJ}[\\s,-]+(?:and\\s+)?){1,5}hair\\b${HAIR_TAIL}\\s+and\\s+`, "gi");
const HAIR_PHRASE = new RegExp(`,?\\s*\\b(?:with|has|having)?\\s*(?:(?:a|his|her)\\s+)?(?:${HAIR_ADJ}[\\s,-]+(?:and\\s+)?){1,4}hair\\b${HAIR_TAIL}`, "gi");
const HAIRED_MID = new RegExp(`,\\s*(?:${HAIR_ADJ}-)+haired\\s*,`, "gi");
const HAIRED = new RegExp(`\\b(?:${HAIR_ADJ}-)+haired\\b\\s*`, "gi");
const HAIR_COLOR_WORD = /\b(?:blond|blonde|golden-haired|fair-haired|redheaded|redhead)\s+(?=(?:boy|girl|child|kid|hero)\b)/gi;
const HAIR_STYLE_ONLY = /,?\s*\b(?:with|in)\s+(?:a|an|two|his|her)\s+(?:[A-Za-z'-]+\s+){0,2}?(?:ponytails?|pigtails?|braids?|bun|buns)\b/gi;

/** Removes the hero's hair colour/hairstyle from the writer's scene text (hair comes only from the avatar). */
export function stripHeroHair(scene: string): string {
  const src = String(scene || "");
  let s = src.replace(WHO_HAS_HAIR, "").replace(WITH_HAIR_AND, "$1 ").replace(HAIR_PHRASE, "").replace(HAIRED_MID, ",").replace(HAIRED, "").replace(HAIR_COLOR_WORD, "").replace(HAIR_STYLE_ONLY, "");
  if (s === src) return src;
  return tidy(s);
}

const STYLE_SUFFIX = "(?:\\s+(?:art\\s+)?(?:style|look|illustration|drawing|painting|render(?:ing)?|effect|texture|aesthetic|animation|art))";
// Always a drawing style.
const STYLE_ALWAYS = "(?:flat\\s+colou?rs?|flat\\s+shading|watercolou?r|water-colou?r|2d|2-d|painterly|anime|manga|gouache|hand-drawn|cartoonish|cartoon-like|cel-shaded)";
// A style only when followed by style/illustration/drawing… ("holding a crayon" stays).
const STYLE_WITH_SUFFIX = "(?:flat|flat\\s+vector|vector|cartoon|comic(?:-book|\\s+book)?|sketch|pencil|crayon|pastel|oil|line|ink|storybook|children's\\s+book|picture\\s+book|classic|traditional|paper\\s+cut-?out)";
const STYLE_PHRASE = new RegExp(
  `,?\\s*\\b(?:(?:in|with)\\s+(?:a|an|the)\\s+)?(?:(?:soft|gentle|loose|simple|whimsical|delicate|bright)\\s+)?(?:${STYLE_ALWAYS}${STYLE_SUFFIX}{0,2}|${STYLE_WITH_SUFFIX}${STYLE_SUFFIX}{1,2})\\b`, "gi");
const STYLE_SENTENCE = /(^|[.!?]\s+)(?:art\s+)?style\s*:[^.!?\n]*[.!?]?/gi;

/** Removes drawing-style words the writer added (every picture is 3D; locked rule 4). */
export function stripStyleWords(scene: string): string {
  const src = String(scene || "");
  let s = src.replace(STYLE_SENTENCE, "$1");
  for (let i = 0; i < 3; i++) s = s.replace(STYLE_PHRASE, ""); // "2D cartoon style" = two phrases
  if (s === src) return src;
  return tidy(s);
}

function tidy(s: string): string {
  return s.replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;!?])/g, "$1").replace(/,\s*,/g, ",").replace(/,([.;!?])/g, "$1")
    .replace(/(^|\n)\s*[,;]\s*/g, "$1").replace(/\(\s*\)/g, "").replace(/([.!?])\s*[,;]\s*/g, "$1 ")
    .replace(/(\b(?:[A-Z][a-z]+|boy|girl|child|toddler|kid))\s+and\s+(a|an|his|her)\s+((?:small\s+|tiny\s+|knitted\s+)?(?:kippah|yarmulke|glasses))/g, "$1 with $2 $3")
    .replace(/\.{2,}/g, ".").replace(/\s+([,.;!?])/g, "$1").replace(/(^|[.!?]\s+)([a-z])/g, (_m, a, b) => a + b.toUpperCase()).trim();
}

/**
 * Scene text saved by generate-story: drawing-style words always removed; for short-instruction stories also
 * the hero's hair (avatar), and the hero's clothes when the parent asked for none (story_outfit empty).
 */
export function cleanSavedScene(scene: string, opts: { short: boolean; requestedOutfit?: string | null }): string {
  let s = String(scene || "");
  if (opts.short) {
    if (!String(opts.requestedOutfit || "").trim()) s = stripHeroClothes(s);
    s = stripHeroHair(s);
  }
  return stripStyleWords(s);
}

/** Short line: only the characters of this page appear (the hero, the page's gang members and the people named in the scene). */
export function onlyCharactersLine(cast: ShortCastKey[]): string {
  const names = ["the main child", ...cast.map((k) => NAME[k])];
  return `Only these characters appear: ${names.join(", ")} and the people named in the scene — no other children.`;
}

export function buildShortIllustrationPrompt(input: ShortPromptInput): string {
  const outfit = String(input.requestedOutfit || "").trim();
  const scene = cleanSavedScene(input.scene, { short: true, requestedOutfit: outfit });
  const lines: string[] = [AVATAR_LINE, scene.trim(), onlyCharactersLine(input.cast || [])];
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

/** Writer rule (short-instruction stories): the hero's clothes are never invented. */
export const HERO_CLOTHES_WRITER_RULE_HE =
  "\n\n## 👕 בגדי הגיבור/ה — גובר על כל הוראת לבוש אחרת למעלה\n" +
  "- הבגדים של הגיבור/ה נלקחים אוטומטית מהאווטאר שלו/ה. **אסור** לתאר את בגדי הגיבור/ה ב-illustration_prompt (לא חולצה, לא צבע בגד, לא תחפושת, לא גלימה, לא מדים, לא סמל).\n" +
  "- **אסור** להלביש את הגיבור/ה בתחפושת, במדים או בבגדים מיוחדים בטקסט הסיפור, אלא אם ההורה ביקש את זה במפורש בטקסט שכתב.\n" +
  "- מותר רק שינוי בגדים שהוא חלק מהעלילה (פיג'מה לפני השינה, מעיל בגשם), ורק בטקסט העמוד.\n" +
  "- דמויות החבורה: כמו תמיד, רק שם באנגלית ומה הן עושות — הבגדים הרשמיים שלהן מתווספים אוטומטית.\n" +
  "- גם השיער של הגיבור/ה נלקח מהאווטאר: **אסור** לכתוב צבע שיער או תסרוקת של הגיבור/ה, ואסור לכתוב סגנון ציור (watercolor, 2D, cartoon וכו') ב-illustration_prompt.\n" +
  "- בכל illustration_prompt לכתוב רק את הדמויות שמופיעות בעמוד הזה, בשמן. לא להוסיף ילדים או אנשים שלא כתובים בעמוד.\n" +
  "- המשפחה קבועה בכל הסיפור: אותו מספר אחים ואחיות, אותם שמות ואותם גילים בכל העמודים.\n";
export const HERO_CLOTHES_WRITER_RULE_EN =
  "\n\n## Hero clothes — overrides every outfit/wardrobe instruction above\n" +
  "- The hero's clothes come automatically from the child's avatar. Never describe the hero's clothes in illustration_prompt (no shirt, garment colour, costume, cape, uniform or emblem).\n" +
  "- Never dress the hero in a costume, uniform or special clothes in the story text unless the parent's own request explicitly asks for it.\n" +
  "- Only a plot change of clothes (pajamas at bedtime, a raincoat in the rain) is allowed, and only in the page text.\n" +
  "- Gang characters: as always, only their English name and what they do — their official clothes are added automatically.\n" +
  "- The hero's hair also comes from the avatar: never write the hero's hair colour or hairstyle, and never a drawing style (watercolor, 2D, cartoon…) in illustration_prompt.\n" +
  "- In every illustration_prompt name only the characters who appear on that page. Never add children or people who are not on the page.\n" +
  "- The family stays the same through the whole story: same number of siblings, same names and same ages on every page.\n";

// ─── Checks after the drawing ───

export interface ClothesCheck {
  /** Clothes the parent asked for; null/empty = the avatar's clothes. */
  outfit?: string | null;
  cast: ShortCastKey[];
  /** The page's story text without nikud (lets a plot change of clothes pass). */
  pageText?: string;
  /** The page's scene description (who may appear besides the hero and the gang). */
  scene?: string;
}

/** JSON keys answered by clothesCheckQuestions. */
export const CLOTHES_JSON_KEYS = '"hero_clothes_ok":bool,"gang_clothes_ok":bool,"foreign_flag":bool,"hero_hair_ok":bool,"extra_child":bool,';

/** Clothes + flag questions. `page` / `avatar` name the pictures, e.g. "Image B" / "Image A". */
export function clothesCheckQuestions(page: string, avatar: string, c: ClothesCheck): string {
  const outfit = String(c.outfit || "").trim();
  const text = String(c.pageText || "").replace(/[\u0591-\u05C7]/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
  let q = `- hero_clothes_ok: does the main child in ${page} wear ${outfit ? `"${outfit}"` : `the same clothes as in ${avatar} (same garments and colors)`}? ` +
    `true also when this page's story text has the child in other clothes (e.g. pajamas at bedtime)${text ? `. Story text (meaning only): "${text}"` : ""}. Ignore clothes hidden by framing.\n`;
  if (c.cast.length) {
    q += `- gang_clothes_ok: does each of these characters in ${page} wear only their own official clothes — ${c.cast.map((k) => `${NAME[k]}: ${GANG_CLOTHES[k]}`).join("; ")} — and none of them wears the main child's clothes? true for a character who is not visible.\n`;
  }
  q += `- hero_hair_ok: is the main child's hair in ${page} the same colour AND about the same length as in ${avatar}? false if clearly lighter/darker (e.g. blond vs dark brown) or clearly shorter/longer.\n`;
  const scene = String(c.scene || "").replace(/\s+/g, " ").trim().slice(0, 300);
  const allowed = ["the main child", ...c.cast.map((k) => NAME[k])].join(", ");
  q += `- extra_child: is there any child in ${page} other than ${allowed} and the children mentioned in this page's story text${scene ? ` or scene ("${scene}")` : ""}? Babies count as children; adults do not.\n`;
  q += `- foreign_flag: is there any flag other than Israel's (blue star of David on white), or a stars-and-stripes pattern, anywhere in ${page}?\n`;
  return q;
}

export const HERO_CLOTHES_PROBLEM = "hero clothes";
export const GANG_CLOTHES_PROBLEM = "gang clothes";
export const FLAG_PROBLEM = "foreign flag";
/** Hair colour/length differs from the avatar — never saved, not even as the closest try. */
export const HERO_HAIR_PROBLEM = "hero hair";
/** A child who is not on the page — redrawn, and never saved if the redraw fails too. */
export const EXTRA_CHILD_PROBLEM = "extra child";
export const HARD_PROBLEMS = [HERO_HAIR_PROBLEM, EXTRA_CHILD_PROBLEM] as const;
export function hasHardProblem(problems: string[]): boolean {
  return problems.some((x) => (HARD_PROBLEMS as readonly string[]).includes(x));
}

export function clothesProblemsFrom(p: Record<string, unknown>, c: ClothesCheck): string[] {
  const out: string[] = [];
  if (p.hero_clothes_ok === false) out.push(HERO_CLOTHES_PROBLEM);
  if (c.cast.length && p.gang_clothes_ok === false) out.push(GANG_CLOTHES_PROBLEM);
  if (p.foreign_flag === true) out.push(FLAG_PROBLEM);
  if (p.hero_hair_ok === false) out.push(HERO_HAIR_PROBLEM);
  if (p.extra_child === true) out.push(EXTRA_CHILD_PROBLEM);
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
  if (problems.includes(HERO_HAIR_PROBLEM)) parts.push("the main child's hair has exactly the avatar's colour and length");
  if (problems.includes(EXTRA_CHILD_PROBLEM)) parts.push("only the characters named in the scene — no other children");
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
