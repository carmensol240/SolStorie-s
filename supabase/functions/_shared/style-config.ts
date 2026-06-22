/**
 * Single source of truth for all illustration style settings,
 * Pixar definitions, character descriptions, and reference URLs.
 *
 * Every edge function that generates images MUST import from here.
 */

// ─── Full Bleed Instruction ───

export const FULL_BLEED_INSTRUCTION = `CRITICAL: This must be a PURE ILLUSTRATION with zero UI elements. Shoot as if a professional photographer took this scene in real life - no phone screens, no app interfaces, no screenshots, no device frames anywhere in the image. The image must look like a scene from a Pixar movie, not a screenshot of an app.`;

// ─── Pixar Style Prompts ───

export const PIXAR_STYLE = `${FULL_BLEED_INSTRUCTION} Pixar 3D animation style, realistic proportions, warm lighting, detailed hair and skin texture, cinematic quality, Disney-Pixar movie aesthetic like Inside Out or Encanto. Natural skin with subtle pores and warmth, expressive realistic eyes with detailed irises, detailed flowing hair with individual strands visible, warm cinematic soft lighting, rich colorful environment with depth and detail. NOT chibi, NOT toy-like, NOT bobblehead, NOT oversized head. Full body from head to toe, feet VISIBLE and GROUNDED on the surface.`;

export const PIXAR_STYLE_COMPACT = `${FULL_BLEED_INSTRUCTION} Pixar 3D animation style, realistic proportions, warm lighting, detailed hair and skin texture, cinematic quality, Disney-Pixar movie aesthetic like Inside Out or Encanto. Natural warm skin, expressive realistic eyes, detailed hair, soft cinematic lighting, rich colorful backgrounds. NOT chibi, NOT toy-like, NOT bobblehead. Characters must look like 3D animated movie characters with consistent realistic proportions. ALWAYS show characters FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface. Frame the character with generous margin from all edges.`;

// ─── Negative Prompts ───

/**
 * ⚠️  DO NOT REMOVE OR MODIFY — Core negative prompt for all fal.ai illustration calls.
 * This ensures generated images are clean, full-bleed illustrations without UI artifacts.
 */
export const ILLUSTRATION_NEGATIVE_PROMPT = `no UI elements, no borders, no phone frame, no icons, no text overlays, no screenshot artifacts, no black bars, no device frame, no toolbar, no navigation bar, no crop marks, no frame border, no margin, no padding around image, full bleed image, clean illustration only, no screenshot, no phone screen, no device frame, no status bar, no notification bar, no mobile UI, no browser chrome, no app interface visible, no black bars, no black side margins, no letterbox, no pillarbox`;

export const NEGATIVE_PROMPT = `chibi, toy-like, bobblehead, oversized head, doll-like, figurine, realistic, photograph, semi-realistic, dark, muted, bokeh, hyper-realistic, floating head, missing body, extra limbs, cropped feet, text, watermark, UI elements, multiple characters, group shot, black bars, black borders, taskbar, status bar, phone frame, app interface, screenshot artifacts, interface elements, icons, text overlays, buttons, menus, device mockup, no screens, no devices, no phones, no tablets, no frames. Clean illustration only, full bleed image, no borders of any kind. ${ILLUSTRATION_NEGATIVE_PROMPT}`;

export const NEGATIVE_PROMPT_FULL = `chibi, toy-like, bobblehead, oversized head, doll-like, figurine, realistic, semi-realistic, real human, photograph, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field, floating head, missing body, missing limbs, extra limbs, deformed, distorted, scary, horror, mutated, cropped feet, cut off legs, floating character, half-body, missing feet, text, watermark, UI elements, black bars, black borders, taskbar, status bar, phone frame, app interface, screenshot artifacts, interface elements, icons, text overlays, buttons, menus, navigation bars, device mockup, no screens, no devices, no phones, no tablets, no frames. Clean illustration only, full bleed image, no borders of any kind. no kippah on girls, no yarmulke on female characters, no male religious clothing on female characters, no gender-inappropriate religious symbols, no tzitzit on girls. boy in dress, boy in skirt, boy wearing tutu, boy with flower crown, boy with bow in hair, boy with hair ribbons, boy with makeup, boy with lipstick, boy with purse, boy with feminine jewelry, boy with earrings, boy with long ponytail with ribbon, feminine clothing on boy, dress on male character, skirt on male character, frilly clothing on boy, pink frilly dress on boy, princess dress on boy. ${ILLUSTRATION_NEGATIVE_PROMPT}`;

export const CAST_NEGATIVE_PROMPT = NEGATIVE_PROMPT_FULL;

// ─── Character Asset URLs ───

const CHARACTER_ASSETS_BASE = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets";

export const SOL_CASUAL_URL = `${CHARACTER_ASSETS_BASE}/sol%20casual.png`;
export const SOL_HERO_URL = `${CHARACTER_ASSETS_BASE}/sol%20hero.png`;
export const MOM_CARMEN_URL = `${CHARACTER_ASSETS_BASE}/mom-carmen.jpeg`;

export const CHARACTER_BASE_REFS = [
  `${CHARACTER_ASSETS_BASE}/ben.jpeg`,
  `${CHARACTER_ASSETS_BASE}/zoe.jpeg`,
  `${CHARACTER_ASSETS_BASE}/leo.jpeg`,
  `${CHARACTER_ASSETS_BASE}/mia.jpeg`,
];

export const CHARACTER_BASE_REFS_WITH_MOM = [
  ...CHARACTER_BASE_REFS,
  MOM_CARMEN_URL,
];

// ─── Adventure Topics (Sol Hero vs Sol Casual) ───

export const ADVENTURE_TOPICS = new Set([
  "space-adventure", "magic-kingdom", "zoo-adventure", "cloud-adventure",
  "magic-castle", "magic-keys", "magical-forest", "space-hero", "kingdom",
  "underwater", "superheroes", "fantasy", "adventure", "dragon", "princess",
  "pirate", "fairy", "wizard",
  "moses-basket", "exodus", "noah-ark", "joseph-brothers", "david-goliath",
  "abraham-sarah", "jonah-fish", "samson-hero", "esther-queen", "hanukkah-miracle",
]);

export function getSolUrl(topic: string): { url: string; label: string } {
  const isAdventure = ADVENTURE_TOPICS.has(topic);
  return {
    url: isAdventure ? SOL_HERO_URL : SOL_CASUAL_URL,
    label: isAdventure ? "Sol hero" : "Sol casual",
  };
}

export function buildCharacterRefs(topic: string) {
  const isAdventure = ADVENTURE_TOPICS.has(topic);
  const solUrl = isAdventure ? SOL_HERO_URL : SOL_CASUAL_URL;
  const solLabel = isAdventure ? "Sol hero" : "Sol casual";
  return {
    urls: [solUrl, ...CHARACTER_BASE_REFS_WITH_MOM],
    solLabel,
    isAdventure,
  };
}

// ─── Cast Character Descriptions (for topic-image generation prompts) ───

export const CAST_DESCRIPTIONS = {
  sol: "a 4-year-old girl named Sol with tanned olive skin, freckles, expressive eyes with detailed irises, long brown wavy hair tied in a high bun with a pink scrunchie, wearing a superhero outfit: a red cape, a light blue t-shirt with a golden star emblem on the chest, purple pants and white sneakers. Realistic proportions, smooth stylized skin, natural warm lighting.",
  ben: "a toddler boy named Ben with very dark brown extremely curly voluminous hair, expressive eyes with detailed irises, tanned skin, wearing a green t-shirt. He is the smallest character. Realistic proportions, smooth stylized skin, natural warm lighting.",
  mia: "a girl named Mia with a smooth brown bob haircut, a small flower crown, wearing a green dress, expressive eyes with detailed irises. Realistic proportions, smooth stylized skin, natural warm lighting.",
  leo: "a boy named Leo with straight black hair, round glasses, wearing denim overalls over a red-yellow striped shirt, expressive eyes with detailed irises. Realistic proportions, smooth stylized skin, natural warm lighting.",
  zoe: "a girl named Zoe with voluminous black curls, a light blue headband, wearing a purple-yellow sporty tracksuit, expressive eyes with detailed irises. Realistic proportions, smooth stylized skin, natural warm lighting.",
} as const;

// ─── Full Character Card Descriptions (detailed, for cover/illustration prompts) ───

export const CHARACTER_CARDS = {
  sol_hero: `Sol – 7-8 year old girl. Dark brown slightly wavy hair in a ponytail. Large brown eyes, rosy cheeks, warm medium skin, bright confident smile. Blue superhero suit, gold star emblem, red cape, gold belt, red gloves and boots.`,
  sol_casual: `Sol – 7-8 year old girl. Dark brown slightly wavy hair, loose with colorful hair tie. Large brown eyes, rosy cheeks, warm medium skin. White t-shirt, jeans.`,
  ben: `Ben – Sol's little brother, 3-4 years old. Dark very curly voluminous hair, large brown eyes, chubby rosy cheeks, warm medium skin, big joyful smile. Colorful toddler clothing.`,
  mia: `Mia – 6-7 year old girl. Dark brown short curly hair in loose bun with WHITE DAISY FLOWER CROWN. Large wonder-filled brown eyes, light warm skin, rosy chubby cheeks. Green dress with floral embroidery, white sneakers.`,
  leo: `Leo – 7-8 year old boy. Dark brown short messy hair, light warm skin, rosy cheeks, large brown eyes, big joyful smile. Paint splatter on face. Red-yellow striped shirt, blue denim overalls with paint stains, brown sneakers.`,
  zoe: `Zoe – 7-8 year old girl. Big wild dark brown curls, dark warm skin, large brown eyes, chubby cheeks, confident smile. Backwards black cap, light blue headband. Colorful sporty tracksuit (red/yellow/purple), orange sneakers.`,
  mom_carmen: `Carmen – Sol's mom, mid-30s. Long dark brown wavy hair, warm olive skin, gentle brown eyes, kind smile. Casual colorful clothing.`,
} as const;

// ─── Style Suffix (for topic image generation) ───

export const TOPIC_IMAGE_STYLE_SUFFIX = `Pixar 3D animation style, realistic proportions, warm lighting, detailed hair and skin texture, cinematic quality, Disney-Pixar movie aesthetic like Inside Out or Encanto. Natural warm skin, expressive realistic eyes, detailed hair, soft cinematic lighting, rich colorful backgrounds. Characters must look like 3D animated movie characters with consistent realistic proportions. NOT chibi, NOT toy-like, NOT bobblehead. 9:16 portrait aspect ratio. Negative prompt: ${NEGATIVE_PROMPT_FULL}`;

// ─── Character Consistency ───

export const CHARACTER_CONSISTENCY_PROMPT = `CRITICAL — CHARACTER CONSISTENCY: The main character must look IDENTICAL in every illustration throughout the story. Same hair color, same hair style, same eye color, same face shape, same skin tone, same outfit in every scene. Any visual deviation between pages is a failure.`;

export const GENDER_SYMBOL_RESTRICTION = `CRITICAL — GENDER-APPROPRIATE APPEARANCE (ABSOLUTE RULE):
- If the main character is a BOY: he MUST wear masculine clothing only (pants, shorts, t-shirt, hoodie, sweater, jacket, sneakers or boots). ABSOLUTELY NO dresses, NO skirts, NO tutus, NO frilly/princess clothing, NO feminine hair accessories (no flower crowns, no bows, no hair ribbons, no decorative hairpins), NO makeup, NO lipstick, NO purses, NO feminine jewelry or earrings. Hair must be a boy's hairstyle (short or medium length, no decorated ponytails, no buns with flowers).
- If the main character is a GIRL: NO kippah, NO yarmulke, NO tzitzit, NO male religious clothing or symbols of any kind.
- Clothing, hairstyle, and accessories MUST clearly match the stated gender of the main character in EVERY scene without exception. Any visual mismatch with the stated gender is a failure.
- DEFAULT IS SECULAR / UNIVERSAL: NO religious accessories of any kind (no kippah/yarmulke, no tzitzit, no head covering, no veil/hijab, no cross, no rosary, no priestly robes, no monk garb) UNLESS the scene description explicitly requests a religious item as part of the story (e.g. a Bible-story scene). When the scene does not mention religion, the character must look like a regular modern child in everyday clothing.`;

/** Build an explicit gender + secular header to prepend to every illustration prompt. */
export function buildGenderHeader(childGender?: string | null): string {
  const isFemale = (childGender || "").toLowerCase() === "female";
  const label = isFemale ? "GIRL" : "BOY";
  const pronoun = isFemale ? "she/her" : "he/him";
  const femaleRule = `She is a GIRL. Feminine or neutral clothing only. ABSOLUTELY NO kippah, NO yarmulke, NO tzitzit, NO peyot/sidelocks, NO male religious clothing or symbols.`;
  const maleRule = `He is a BOY. Masculine clothing only (pants/shorts/t-shirt/hoodie/sneakers). NO female head covering (no hijab, no veil, no flower crown, no hair bows), NO dresses, NO skirts, NO feminine accessories.`;
  return `MAIN CHARACTER GENDER (ABSOLUTE): The main character is a ${label} (${pronoun}). ${isFemale ? femaleRule : maleRule}
SECULAR / UNIVERSAL DEFAULT: Do NOT add any religious accessories (kippah, yarmulke, tzitzit, head covering, veil, cross, rosary, etc.) unless the scene description below explicitly asks for one.`;
}

// ─── Helpers ───

/** Build an inline Pixar face-reference prompt block */
export function buildFaceReferenceBlock(avatarDescription?: string): string {
  const faceRef = `FACE REFERENCE: The main character's face MUST be an EXACT 3D Pixar rendering of the child in the reference photo. Keep all facial features, hair color, hair texture, and skin tone identical.`;
  if (avatarDescription) {
    return `${faceRef}\nCHARACTER DETAILS: ${avatarDescription}`;
  }
  return faceRef;
}

/** Build a full illustration prompt with style and scene */
export function buildIllustrationPrompt(
  scene: string,
  options?: {
    withFaceRef?: boolean;
    avatarDescription?: string;
    adventureInstruction?: string;
  }
): string {
  const parts: string[] = [];

  if (options?.withFaceRef) {
    parts.push(buildFaceReferenceBlock(options.avatarDescription));
    parts.push("");
  }

  parts.push(`STYLE: ${PIXAR_STYLE}`);
  parts.push("");

  if (options?.adventureInstruction) {
    parts.push(options.adventureInstruction);
    parts.push("");
  }

  parts.push(`SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${scene}`);
  parts.push("");
  parts.push(GENDER_SYMBOL_RESTRICTION);
  parts.push("");
  parts.push(`NEGATIVE: ${CAST_NEGATIVE_PROMPT}`);

  return parts.join("\n");
}
