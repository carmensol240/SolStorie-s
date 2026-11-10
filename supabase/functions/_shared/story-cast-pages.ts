// Which pages of a new story get a picture, and where a SolStories cast member first appears.
// Rules: the last page of a free taste is always illustrated; the page where a cast member
// (Sol, Mia, Leo, Zoe, Ben) first appears is always illustrated and its picture shows them.

import { CAST_DESCRIPTIONS } from "./style-config.ts";

export type CastKey = keyof typeof CAST_DESCRIPTIONS;

const NIKUD_RE = /[\u0591-\u05C7]/g;
// One optional Hebrew prefix letter (ו, ל, ש, ה, כ, מ, ב) before the name.
const PREFIX = "[ולשהכמב]?";
const CAST_HE: Record<CastKey, string[]> = {
  sol: ["סול"], mia: ["מיה", "מיא"], leo: ["ליאו"], zoe: ["זואי"], ben: ["בן"],
};

function mentions(text: string, key: CastKey): boolean {
  const t = String(text || "").replace(NIKUD_RE, "");
  if (key === "ben") {
    // "בן" is also an everyday word ("son", "aged"): count it only as Sol's little brother.
    if (!/(^|[^\u05D0-\u05EA])בן([^\u05D0-\u05EA]|$)/.test(t)) return false;
    return /סול|אחיה|אחותו|האחים/.test(t);
  }
  if (/\b(sol|mia|leo|zoe)\b/i.test(t) && new RegExp(`\\b${key}\\b`, "i").test(t)) return true;
  return CAST_HE[key].some((n) => new RegExp(`(^|[^\\u05D0-\\u05EA])${PREFIX}${n}([^\\u05D0-\\u05EA]|$)`).test(t));
}

/** First page number where each cast member is named (hero's own name excluded by the caller). */
export function firstCastAppearances(
  pages: Array<{ page_number: number; text: string }>,
  skip: CastKey[] = [],
): Map<CastKey, number> {
  const out = new Map<CastKey, number>();
  const sorted = [...pages].sort((a, b) => a.page_number - b.page_number);
  for (const key of Object.keys(CAST_HE) as CastKey[]) {
    if (skip.includes(key)) continue;
    const hit = sorted.find((p) => mentions(p.text, key));
    if (hit) out.set(key, hit.page_number);
  }
  return out;
}

/** Pages the writer is told will have a picture: the usual pattern plus the taste's last page. */
export function plannedIllustrationPages(totalPages: number, ageRange: string, tastePages: number | null): number[] {
  const out: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (ageRange === "0-2" || i % 2 === 1 || (tastePages != null && i === tastePages)) out.push(i);
  }
  return out;
}

/**
 * After the final page numbering: force a picture on the taste's last page and on every
 * cast member's first page, and make sure that picture's prompt describes the cast member.
 * Returns the page numbers that were changed.
 */
export function enforceCastAndTastePictures<T extends { page_number: number; text: string; illustration_prompt?: string | null; _illustrate?: boolean }>(
  pages: T[],
  opts: { tastePages: number | null; skip?: CastKey[] },
): number[] {
  const changed = new Set<number>();
  const byNum = new Map(pages.map((p) => [p.page_number, p]));
  if (opts.tastePages != null) {
    const last = byNum.get(Math.min(opts.tastePages, pages.length));
    if (last && last._illustrate !== true) { last._illustrate = true; changed.add(last.page_number); }
  }
  for (const [key, num] of firstCastAppearances(pages, opts.skip)) {
    const p = byNum.get(num);
    if (!p) continue;
    if (p._illustrate !== true) { p._illustrate = true; changed.add(num); }
    const prompt = String(p.illustration_prompt || "");
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    if (prompt && !new RegExp(`\\b${name}\\b`, "i").test(prompt)) {
      p.illustration_prompt = `${prompt} Also in the scene, clearly visible next to the hero: ${CAST_DESCRIPTIONS[key]}`;
      changed.add(num);
    }
  }
  return [...changed].sort((a, b) => a - b);
}

/** Extra English text for a fallback prompt so the cast member appears in the picture. */
export function castPromptAddition(text: string, skip: CastKey[] = []): string {
  const keys = (Object.keys(CAST_HE) as CastKey[]).filter((k) => !skip.includes(k) && mentions(text, k));
  return keys.map((k) => ` Also in the scene, clearly visible next to the hero: ${CAST_DESCRIPTIONS[k]}`).join("");
}
