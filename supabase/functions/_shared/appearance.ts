// Parent-chosen appearance (hair / clothes) → one fixed English character
// description that is injected word-for-word into every illustration prompt.
// Pure module (no Deno APIs) so it can be unit-tested with vitest.

export interface Appearance {
  hairColor?: string | null;
  hairStyle?: string | null;
  clothingType?: string | null;
  clothingColor?: string | null;
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
  const pick = (k: keyof Appearance) => clean(fromRequest?.[k]) || clean(fromProfile?.[k]) || "";
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

/** English outfit phrase, or "" if nothing chosen. Type and color are used independently. */
export function clothingToEnglish(a: Appearance): string {
  const type = tr(CLOTHING_TYPE_EN, a.clothingType);
  const color = tr(CLOTHING_COLOR_EN, a.clothingColor);
  if (!type && !color) return "";
  if (type && color) return `a ${color} ${type}`;
  if (type) return `a ${type}`;
  return `${color} clothes`;
}

// Words that mean the story text itself puts the child in a special outfit.
const COSTUME_RE = /לובש|לובשת|לבש|לבשה|חליפ|תחפוש|גלימ|מדים|קסדה|wear|wearing|suit|costume|cape|uniform|helmet/i;

export function pageMentionsOutfit(pageText?: string | null): boolean {
  return COSTUME_RE.test(clean(pageText));
}

/**
 * Parent clothes on every page by default. Topic outfit only on pages whose text
 * describes the child wearing it. No parent clothes → topic outfit as before.
 */
export function resolvePageOutfit(parentOutfit: string, topicOutfit: string | null | undefined, pageText?: string | null): string {
  const topic = clean(topicOutfit);
  if (!parentOutfit) return topic;
  if (topic && pageMentionsOutfit(pageText)) return topic;
  return parentOutfit;
}

export function buildCharacterLock(opts: {
  gender?: string | null;
  age?: number | null;
  ageRange?: string | null;
  hair: string;
  outfit: string;
}): string {
  const g = opts.gender === "female" ? "girl" : "boy";
  const age = opts.age && opts.age > 0 ? `${opts.age}-year-old` : opts.ageRange ? `${opts.ageRange}-year-old` : "young";
  const parts = [`a ${age} ${g}`];
  if (opts.hair) parts.push(`with ${opts.hair}`);
  if (opts.outfit) parts.push(`wearing ${opts.outfit}`);
  let lock = `CHARACTER LOCK (identical on every page): The main character is ${parts.join(", ")}.`;
  if (opts.hair) lock += ` The hair color and hairstyle are chosen by the parent and MUST be exactly as described, even if the reference photo shows different hair.`;
  if (opts.outfit) lock += ` The outfit MUST be exactly as described.`;
  return lock;
}
