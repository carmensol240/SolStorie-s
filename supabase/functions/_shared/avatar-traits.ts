// Hair shade, eye color and skin tone read once from the child's avatar and saved on the story
// (stories.hero_hair_shade / hero_eye_color / hero_skin_tone), then written word for word on every
// page, redraw and check. The avatar picture always wins over any text. Stories created before
// AVATAR_TRAITS_CUTOFF keep their old behaviour.
export const AVATAR_TRAITS_CUTOFF = "2026-11-11T19:00:00Z";

export const HAIR_SHADES = [
  "jet black",
  "near-black very dark brown",
  "dark brown",
  "medium brown",
  "light brown",
  "dark blonde",
  "light blonde",
  "auburn",
  "ginger red",
] as const;
export type HairShade = typeof HAIR_SHADES[number];

/** Form value (children.hair_color, Hebrew) closest to a shade — only for filling an empty profile. */
const SHADE_TO_FORM: Record<HairShade, string> = {
  "jet black": "שחור",
  "near-black very dark brown": "שחור",
  "dark brown": "חום כהה",
  "medium brown": "חום",
  "light brown": "חום בהיר",
  "dark blonde": "בלונדיני",
  "light blonde": "בלונדיני",
  "auburn": "ג'ינג'י",
  "ginger red": "ג'ינג'י",
};

/** features: precise traits that set this child apart from a generic Pixar child (LIKENESS_CUTOFF stories). */
export interface AvatarTraits { hair: HairShade; eyes: string; skin: string; features?: string[] }

// Stories created from LIKENESS_CUTOFF also save distinguishing features (stories.hero_traits),
// written into every face paragraph and checked in the face check, and get the closer framing.
export const LIKENESS_CUTOFF = "2026-11-11T23:00:00Z";
export function usesLikeness(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  return !Number.isNaN(t) && t >= Date.parse(LIKENESS_CUTOFF);
}

/** Cleans the model's feature list: 3–8 short English phrases, else []. */
export function cleanFeatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out = raw.map((v) => String(v ?? "").replace(/[^a-zA-Z0-9 ,\-'/]/g, "").replace(/\s+/g, " ").trim().slice(0, 90))
    .filter((v) => v.length >= 3).slice(0, 8);
  return out.length >= 3 ? out : [];
}

export function usesAvatarTraits(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  return !Number.isNaN(t) && t >= Date.parse(AVATAR_TRAITS_CUTOFF);
}

/** Real age from the profile; the age range only when the profile has none. */
export function realAgeText(profileAge: number | null | undefined, ageRange?: string | null): string {
  const n = Number(profileAge);
  if (Number.isFinite(n) && n > 0) return String(Math.round(n));
  return ageRange ? String(ageRange) : "";
}

export function normalizeHairShade(raw: unknown): HairShade | null {
  const s = String(raw ?? "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return null;
  const exact = HAIR_SHADES.find((h) => h === s);
  if (exact) return exact;
  if (/near|almost|very dark/.test(s) && /black|brown/.test(s)) return "near-black very dark brown";
  if (/jet|^black/.test(s) || s === "black") return "jet black";
  if (/ginger|red|copper/.test(s)) return "ginger red";
  if (/auburn/.test(s)) return "auburn";
  if (/blond/.test(s)) return /dark|dirty|honey/.test(s) ? "dark blonde" : "light blonde";
  if (/brown|brunette|chestnut/.test(s)) {
    if (/dark/.test(s)) return "dark brown";
    if (/light/.test(s)) return "light brown";
    return "medium brown";
  }
  return null;
}

export function parseAvatarTraits(raw: string): AvatarTraits | null {
  try {
    const t = raw.replace(/```json|```/g, "").trim();
    const p = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    const hair = normalizeHairShade(p.hair_shade);
    const clean = (v: unknown) => String(v ?? "").replace(/[^a-zA-Z ,\-]/g, "").trim().slice(0, 60);
    const eyes = clean(p.eye_color);
    const skin = clean(p.skin_tone);
    if (!hair || !eyes || !skin) return null;
    const features = cleanFeatures(p.distinct_features);
    return features.length ? { hair, eyes, skin, features } : { hair, eyes, skin };
  } catch { return null; }
}

export const AVATAR_TRAITS_QUESTION =
  "Look only at the child's head in this picture. Return strict JSON only: " +
  `{"hair_shade": one of ${JSON.stringify(HAIR_SHADES)}, "eye_color": "<e.g. dark brown>", "skin_tone": "<e.g. fair with rosy cheeks>"}. ` +
  "Judge the hair in its darkest natural areas, not highlights from lighting. If the hair looks almost black, answer \"near-black very dark brown\".";

/** Same analysis plus the features that make this child different from a generic Pixar child. */
export const AVATAR_LIKENESS_QUESTION =
  "Look only at the child's head in this picture. Return strict JSON only: " +
  `{"hair_shade": one of ${JSON.stringify(HAIR_SHADES)}, "eye_color": "<e.g. dark brown>", "skin_tone": "<e.g. fair with rosy cheeks>", ` +
  `"distinct_features": ["5 to 8 short precise English phrases"]}. ` +
  "Judge the hair in its darkest natural areas, not highlights from lighting. If the hair looks almost black, answer \"near-black very dark brown\". " +
  "distinct_features: what makes THIS child look different from a generic cute Pixar child, each phrase concrete and visual — " +
  "face shape (e.g. wide square face, full cheeks), eyebrows (shape, thickness), hair length, direction and parting (e.g. short cropped sides, top brushed forward, no bangs), " +
  "ears (e.g. slightly protruding), nose (e.g. small wide button nose), mouth/smile, freckles, moles or other marks. No clothes, no background, no age.";

/** Face-paragraph line for the distinguishing features. */
export function featuresLine(features: string[] | null | undefined): string {
  const f = (features || []).filter(Boolean);
  return f.length ? `Distinguishing features of this child (keep every one; they are what makes the child recognizable): ${f.join("; ")}.` : "";
}

/** Replace the hair color words in a saved description with the avatar shade, keep the cut/style words. */
export function hairWithShade(description: string, shade: HairShade): string {
  const style = String(description || "")
    .replace(/\b(jet|near-black|near|almost|very|dark|medium|light|dirty|honey|black|brown|brunette|chestnut|blonde?|auburn|ginger|red|copper|golden)\b/gi, "")
    .replace(/\s+/g, " ").replace(/^[\s,]+/, "").trim();
  return `${shade} hair${style ? `, ${style}` : ""}`;
}

/** Applied to the resolved profile: avatar traits replace hair color, eyes and skin; age = real age. */
export function applyAvatarTraits<T extends { hairDescription: string; eyeColor: string; skinTone: string; ageDescription: string }>(
  profile: T, traits: AvatarTraits | null, ageText: string,
): T {
  const out = { ...profile };
  if (ageText) out.ageDescription = ageText;
  if (traits) {
    out.hairDescription = hairWithShade(profile.hairDescription, traits.hair);
    out.eyeColor = traits.eyes;
    out.skinTone = traits.skin;
  }
  return out;
}

export function avatarWinsRule(traits: AvatarTraits | null, ageText: string): string {
  const bits: string[] = [];
  if (ageText) bits.push(`exactly ${ageText} years old (not younger, not older)`);
  if (traits) bits.push(`hair ${traits.hair}`, `eyes ${traits.eyes}`, `skin ${traits.skin}`);
  if (!bits.length) return "";
  return `\n\nAVATAR LOCK (same words on every page): the main child is ${bits.join(", ")}. ` +
    "The child's face reference picture ALWAYS wins: if any text, scene description or earlier page disagrees about face, age, hair, eyes or skin, follow the reference picture. Clothes follow the outfit description.";
}

export function formHairFromShade(shade: HairShade): string { return SHADE_TO_FORM[shade]; }
