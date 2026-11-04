// The gender chosen for THIS story always wins over a saved character profile
// (children.avatar_description may still hold the gender of an older story).
export interface GenderedProfile {
  gender: string;
  genderHebrew: string;
  hairDescription: string;
  clothingDescription: string;
}

const OTHER_WORDS: Record<"male" | "female", RegExp> = {
  // words that would name a girl inside a boy's prompt
  male: /\b(girls?|girl's|female|feminine|she|her|princess)\b/gi,
  // words that would name a boy inside a girl's prompt
  female: /\b(boys?|boy's|male|masculine|he|him|his)\b/gi,
};

/** Removes words of the other gender from free-text profile fields. */
export function scrubOtherGender(text: string, gender: "male" | "female"): string {
  return (text || "").replace(OTHER_WORDS[gender], "").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

/** Returns a copy of the profile with gender, Hebrew word and descriptions matching `gender`. */
export function alignProfileGender<T extends GenderedProfile>(profile: T, gender: "male" | "female"): { profile: T; changed: boolean } {
  const genderHebrew = gender === "female" ? "ילדה" : "ילד";
  const next = {
    ...profile,
    gender,
    genderHebrew,
    hairDescription: scrubOtherGender(String(profile.hairDescription || ""), gender),
    clothingDescription: scrubOtherGender(String(profile.clothingDescription || ""), gender),
  } as T;
  const changed = next.gender !== profile.gender || next.genderHebrew !== profile.genderHebrew
    || next.hairDescription !== profile.hairDescription || next.clothingDescription !== profile.clothingDescription;
  return { profile: next, changed };
}
