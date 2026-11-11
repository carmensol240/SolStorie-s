// Detailed comparison of a page against page 1: eyes, hair tone, drawing style, outfit, chest emblem.
// A page failing only these gets one redraw; if it still fails, the closer picture is kept and the
// story becomes needs_attention (the saved log's identity_check starts with LOOK_KEPT_PREFIX).
export const LOOK_PROBLEMS = ["eye color", "hair tone", "render style", "outfit vs page 1", "emblem", "avatar face", "avatar age", "avatar hair"] as const;
export const LOOK_KEPT_PREFIX = "look mismatch kept";
export const MAX_LOOK_REDRAWS = 1;

export function lookProblemsFrom(p: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (p.eye_color_match === false) out.push("eye color");
  if (p.hair_tone_match === false) out.push("hair tone");
  if (p.render_style_match === false) out.push("render style");
  if (p.outfit_match_page1 === false) out.push("outfit vs page 1");
  if (p.emblem_match === false) out.push("emblem");
  // Comparison with the child's avatar (new stories): never holds a page, only one redraw then keep closest.
  if (p.avatar_face_match === false) out.push("avatar face");
  if (p.avatar_age_match === false) out.push("avatar age");
  if (p.avatar_hair_match === false) out.push("avatar hair");
  return out;
}

export function isLookOnly(problems: string[]): boolean {
  return problems.length > 0 && problems.every((x) => (LOOK_PROBLEMS as readonly string[]).includes(x));
}

export function lookFixInstruction(problems: string[], differences: string, eyeColor?: string, avatar?: { age?: string; hair?: string }): string {
  const parts: string[] = [];
  if (problems.includes("eye color")) parts.push(`eyes must be exactly ${eyeColor || "the same color as page 1"}, same as page 1`);
  if (problems.includes("hair tone")) parts.push("hair must be the exact same tone and length as page 1, not lighter or darker");
  if (problems.includes("render style")) parts.push("use the exact same polished Pixar-like 3D render as page 1 (same lighting, skin shading, proportions) — never flat 2D, painterly or a different animation style");
  if (problems.includes("outfit vs page 1")) parts.push("the hero wears exactly the same clothes and colors as on page 1");
  if (problems.includes("emblem")) parts.push("the chest emblem must be identical to page 1 in shape and color (if page 1 has no emblem, draw none)");
  if (problems.includes("avatar face")) parts.push("the child's face must match the face reference picture exactly");
  if (problems.includes("avatar age")) parts.push(`the child must look exactly ${avatar?.age ? `${avatar.age} years old` : "the age of the face reference picture"}`);
  if (problems.includes("avatar hair")) parts.push(`hair must be exactly ${avatar?.hair || "the shade in the face reference picture"}, as in the face reference picture`);
  return `\n\nCONSISTENCY FIX (previous attempt differed from page 1${differences ? `: ${differences}` : ""}): ${parts.join("; ")}.`;
}

/** Latest log per page decides: a page whose latest saved picture was kept with a look mismatch needs attention. */
export function pagesWithLookIssue(logs: { page_number: number; identity_check: string | null; created_at: string }[]): Set<number> {
  const latest = new Map<number, { identity_check: string | null; created_at: string }>();
  for (const l of logs) {
    const cur = latest.get(l.page_number);
    if (!cur || l.created_at > cur.created_at) latest.set(l.page_number, l);
  }
  const out = new Set<number>();
  for (const [p, l] of latest) if ((l.identity_check || "").startsWith(LOOK_KEPT_PREFIX)) out.add(p);
  return out;
}
