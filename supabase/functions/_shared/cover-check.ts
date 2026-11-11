// Page 1 (the cover) is the reference for every other page, so it has no page 1 to compare with.
// On a first drawing it is compared only with the child's avatar: same child, hair, eyes and a
// Pixar-like 3D render. Clothes, emblem and "no reference" never count against it, and after the
// redraws it is never left empty: the closest picture is kept and the story needs attention.
import { isLookOnly, LOOK_KEPT_PREFIX } from "./look-check.ts";
import { closestTryIndex, styleProblemsFrom } from "./style-check.ts";

/** identity_check prefix of a cover kept after failed redraws; starts with LOOK_KEPT_PREFIX so the story is needs_attention. */
export const COVER_KEPT_PREFIX = `${LOOK_KEPT_PREFIX} (cover vs avatar)`;

/** Problems for page 1 from the avatar comparison (plus the general picture checks that apply to every page). */
export function coverProblemsFrom(p: Record<string, unknown>, opts: { hasAvatar: boolean; allowText?: boolean }): string[] {
  const out: string[] = [];
  if (opts.hasAvatar) {
    if (p.same_child === false) out.push("different child");
    if (p.hair_tone_match === false) out.push("hair tone");
    if (p.eye_color_match === false) out.push("eye color");
  }
  if (p.render_style_match === false) out.push("render style");
  // Mandatory 3D Pixar check (pixar_3d) + photo-realistic.
  out.push(...styleProblemsFrom(p));
  if (p.hero_face_visible === false) out.push("hero not visible");
  if (p.hero_twice === true) out.push("hero twice");
  if (!opts.allowText && p.has_text === true) out.push("text in image");
  return out;
}

export interface CheckedTry { problems: string[]; reason: string }

/**
 * After every redraw failed: which try to keep instead of leaving the page empty (first drawing only).
 * Page 1 always keeps the closest try. Pages 2+ keep a try only when it differs from page 1 in look only (unchanged rule).
 * null = keep nothing (existing rules decide: old picture stays / hero-hidden keep / hold for admin).
 */
export function keptTryAfterFailedRedraws<T extends CheckedTry>(
  pageNumber: number, hadExisting: boolean, tries: T[],
): { best: T; identityCheck: string; cover: boolean } | null {
  if (hadExisting || tries.length === 0) return null;
  const closest = (list: T[]) => list.reduce((a, b) => (b.problems.length < a.problems.length ? b : a));
  if (pageNumber === 1) {
    // Closest try, preferring one that passed the 3D Pixar check.
    const best = tries[closestTryIndex(tries)];
    return { best, identityCheck: `${COVER_KEPT_PREFIX}: ${best.reason}`.slice(0, 300), cover: true };
  }
  const lookTries = tries.filter((t) => isLookOnly(t.problems));
  if (lookTries.length === 0) return null;
  const best = closest(lookTries);
  return { best, identityCheck: `${LOOK_KEPT_PREFIX}: ${best.reason}`.slice(0, 300), cover: false };
}
