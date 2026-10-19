// Parent-chosen appearance (hair / clothes) → one fixed English character
// description that is injected word-for-word into every illustration prompt.
// Pure module (no Deno APIs) so it can be unit-tested with vitest.

export interface Appearance {
  hairColor?: string | null;
  hairStyle?: string | null;
  clothingType?: string | null;
  clothingColor?: string | null;
  kippah?: boolean | null;
}

const HAIR_COLOR_EN: Record<string, string> = {
  "חום": "brown",
  "שחור": "black",
  "בלונדיני": "blonde",
  "ג'ינג'י": "ginger red",
  "חום בהיר": "light brown",
};

const HAIR_STYLE_EN: Record<string, string> = {
  "קוקיות": "styled in two pigtails (one on each side of the head)",
  "צמה": "styled in a single braid",
  "שיער פזור": "worn loose and down",
  "סרט/קליפס": "with a hair ribbon / hair clip",
  "קצר": "cut short",
};

const CLOTHING_TYPE_EN: Record<string, string> = {
  "בגדי יומיום": "casual everyday clothes (t-shirt and pants)",
  "גיבור/ת על": "superhero costume with a cape",
  "שמלה": "dress",
  "בגד ים": "swimsuit",
  "פיג'מה": "pajamas",
  "בגדי חורף": "warm winter clothes (coat and scarf)",
};

const CLOTHING_COLOR_EN: Record<string, string> = {
  "כחול": "blue",
  "ורוד": "pink",
  "אדום": "red",
  "ירוק": "green",
  "סגול": "purple",
  "צהוב": "yellow",
};

const clean = (v?: string | null) => (v ?? "").toString().trim();
const tr = (map: Record<string, string>, v?: string | null) => {
  const c = clean(v);
  return c ? (map[c] ?? c) : "";
};

/** Request values win; saved profile values fill any gaps. Each field independent. */
export function mergeAppearance(fromRequest?: Appearance | null, fromProfile?: Appearance | null): Appearance {
  // Text fields only; the kippah is never merged from the profile (see kippahForRequest).
  const pick = (k: "hairColor" | "hairStyle" | "clothingType" | "clothingColor") => clean(fromRequest?.[k]) || clean(fromProfile?.[k]) || "";
  return {
    hairColor: pick("hairColor"),
    hairStyle: pick("hairStyle"),
    clothingType: pick("clothingType"),
    clothingColor: pick("clothingColor"),
  };
}

/** English hair phrase, or "" if nothing chosen. Color and style are used independently. */
export function hairToEnglish(a: Appearance): string {
  const color = tr(HAIR_COLOR_EN, a.hairColor);
  const style = tr(HAIR_STYLE_EN, a.hairStyle);
  if (!color && !style) return "";
  return `${color ? color + " " : ""}hair${style ? " " + style : ""}`;
}

const isGirl = (g?: string | null) => (g || "").toLowerCase() === "female";

/** Gender-aware clothing type text. A dress is never given to a boy. */
function clothingTypeFor(type: string, gender?: string | null): string {
  if (!type) return "";
  const girl = isGirl(gender);
  if (type === "שמלה") return girl ? CLOTHING_TYPE_EN["שמלה"] : CLOTHING_TYPE_EN["בגדי יומיום"];
  if (type === "בגד ים") return girl ? "one-piece swimsuit" : "swim trunks";
  if (type === "גיבור/ת על") return girl ? "superhero costume with a cape (girl's version)" : "superhero costume with a cape (boy's version)";
  return CLOTHING_TYPE_EN[type] ?? type;
}

/** English outfit phrase, or "" if nothing chosen. Type and color are used independently. */
export function clothingToEnglish(a: Appearance, gender?: string | null): string {
  const type = clothingTypeFor(clean(a.clothingType), gender);
  const color = tr(CLOTHING_COLOR_EN, a.clothingColor);
  if (!type && !color) return "";
  if (type && color) return `a ${color} ${type}`;
  if (type) return `a ${type}`;
  return `${color} clothes`;
}

/** Translate a free "color type" outfit string from a saved profile (Hebrew words → English). */
export function translateOutfitWords(text?: string | null): string {
  let t = clean(text);
  for (const [he, en] of Object.entries({ ...CLOTHING_COLOR_EN, ...CLOTHING_TYPE_EN })) t = t.split(he).join(en);
  return t;
}

const DEFAULT_OUTFITS = [
  "a yellow t-shirt and blue jeans with white sneakers",
  "a light blue t-shirt and navy shorts with white sneakers",
  "a green t-shirt and beige pants with sneakers",
  "a red t-shirt and dark blue jeans with sneakers",
  "an orange t-shirt and grey pants with sneakers",
];

/** One fixed everyday outfit per story when the parent chose none (stable for the same seed). */
export function pickDefaultOutfit(seed: string): string {
  let h = 0;
  for (const ch of seed || "x") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DEFAULT_OUTFITS[h % DEFAULT_OUTFITS.length];
}

// The hero explicitly changes clothes / puts on a special outfit on this page.
const CHANGE_RE = /(מחליף|מחליפה|מתחלף|מתחלפת|החליף|החליפה|מתלבש|מתלבשת|התלבש|התלבשה)|(לובש|לובשת|לבש|לבשה|שם על עצמו|שמה על עצמה)\s+(את\s+)?(ה)?(פיג'מה|פיג׳מה|פיג'מת|מעיל|בגד ים|בגד הים|חליפ|תחפוש|גלימ|מדים|קסדה|שמלת|מגפי)|puts on|changes into|dressed in|wearing (a |an |his |her )?(pajamas|raincoat|swimsuit|costume|cape|uniform|space suit|helmet)/i;
const COSTUME_NOUN_RE = /פיג'מה|פיג׳מה|מעיל|בגד ים|חליפ|תחפוש|גלימ|מדים|קסדה|pajamas|raincoat|swimsuit|costume|cape|uniform|helmet/i;

/** True only when the page text says the hero changes into / puts on a specific outfit. */
export function pageMentionsOutfit(pageText?: string | null): boolean {
  return CHANGE_RE.test(clean(pageText));
}

/**
 * Parent clothes on every page by default. Topic outfit only on pages whose text says
 * the hero changes into it, and on the next page only if it continues that scene
 * (mentions the outfit again). No parent clothes → topic outfit as before.
 */
export function resolvePageOutfit(parentOutfit: string, topicOutfit: string | null | undefined, pageText?: string | null, prevPageText?: string | null): string {
  const topic = clean(topicOutfit);
  if (!parentOutfit) return topic;
  if (topic && pageMentionsOutfit(pageText)) return topic;
  if (topic && pageMentionsOutfit(prevPageText) && COSTUME_NOUN_RE.test(clean(pageText))) return topic;
  return parentOutfit;
}

/** Kippah from THIS request only (missing = false). Never merged from the saved profile. Girls: never. */
export function kippahForRequest(gender?: string | null, requestKippah?: unknown): boolean {
  return !isGirl(gender) && requestKippah === true;
}

/** Kippah for an existing story: the story's own columns only, never the child profile. Girls: never. */
export function kippahForStory(story?: { kippah?: boolean | null; child_gender?: string | null; kippah_color?: string | null } | null): { kippah: boolean; color: string } {
  const on = !!story && !isGirl(story.child_gender) && story.kippah === true;
  return { kippah: on, color: on ? (clean(story?.kippah_color) || "dark blue") : "" };
}

/** Kippah color: the chosen clothes color, or dark blue. */
export function kippahColor(a: Appearance): string {
  return tr(CLOTHING_COLOR_EN, a.clothingColor) || "dark blue";
}

/** Religious items are allowed only when the parent chose a religious style. None exists today. */
export const RELIGIOUS_STYLES: string[] = [];
export const isReligiousStyle = (type?: string | null) => RELIGIOUS_STYLES.includes(clean(type));

/**
 * Character core: face, skin, eyes, hair, glasses and body/age only — never clothes.
 * Safe to save as a permanent "character card".
 */
export function buildCharacterCore(opts: {
  gender?: string | null; age?: number | null; ageRange?: string | null;
  hair?: string; skin?: string; eyes?: string; glasses?: boolean; religiousStyle?: boolean;
  kippah?: boolean; kippahColor?: string;
}): string {
  const kippah = !!opts.kippah && !isGirl(opts.gender);
  const g = isGirl(opts.gender) ? "girl" : "boy";
  const age = opts.age && opts.age > 0 ? `${opts.age}-year-old` : opts.ageRange ? `${opts.ageRange}-year-old` : "young";
  const parts = [`a ${age} ${g}`];
  if (opts.hair) parts.push(`with ${opts.hair}`);
  if (opts.skin) parts.push(`${opts.skin} skin`);
  if (opts.eyes) parts.push(`${opts.eyes} eyes`);
  if (opts.glasses) parts.push("wearing glasses");
  if (kippah) {
    parts.push(`wearing a small knitted ${clean(opts.kippahColor) || "dark blue"} kippah`);
    parts.push("small kippah on the head, hair visible");
  } else if (!opts.religiousStyle) parts.push("uncovered head, hair visible");
  return parts.join(", ");
}

export function buildOutfitLine(outfit: string): string {
  return outfit ? `wearing ${outfit}` : "";
}

export function buildCharacterLock(opts: {
  gender?: string | null;
  age?: number | null;
  ageRange?: string | null;
  hair: string;
  outfit: string;
  glasses?: boolean;
  religiousStyle?: boolean;
  kippah?: boolean;
  kippahColor?: string;
}): string {
  const core = buildCharacterCore({ gender: opts.gender, age: opts.age, ageRange: opts.ageRange, hair: opts.hair, glasses: opts.glasses, religiousStyle: opts.religiousStyle, kippah: opts.kippah, kippahColor: opts.kippahColor });
  const outfitLine = buildOutfitLine(opts.outfit);
  let lock = `CHARACTER LOCK (identical on every page): The main character is ${core}${outfitLine ? `, ${outfitLine}` : ""}.`;
  if (opts.hair) lock += ` The hair color and hairstyle are chosen by the parent and MUST be exactly as described, even if the reference photo shows different hair.`;
  if (opts.outfit) lock += ` The outfit MUST be exactly as described.`;
  if (opts.kippah && !isGirl(opts.gender)) lock += ` The small kippah MUST appear on his head on EVERY page, with every outfit (including pajamas, swimwear and costumes).`;
  return lock;
}
