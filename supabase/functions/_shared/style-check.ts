// Mandatory "3D Pixar" check on every drawing (first drawings, redraws, admin redraws) and,
// on redraws, a face check against the child's face reference picture (avatar).
// A failed picture is redrawn with a correction, up to MAX_STYLE_REDRAWS times. If it still fails,
// the previous picture stays (or, for a page that had none, see redrawDecision) and the admin is alerted.
import { LOOK_KEPT_PREFIX, AVATAR_STYLE_FACE_FIX, AVATAR_BLEND_FIX } from "./look-check.ts";
import { imageSize, shapeMatches, shapeFixInstruction, SHAPE_PROBLEM } from "./illustration-format.ts";
import { clothesCheckQuestions, clothesProblemsFrom, clothesFixInstruction, type ClothesCheck } from "./short-prompt.ts";

export const STYLE_PROBLEM = "not 3D Pixar";
export const MAX_STYLE_REDRAWS = 2;

/** The style question asked in every picture check. */
export const PIXAR_3D_QUESTION =
  "- pixar_3d: is the picture a polished Pixar/Disney-like full 3D CGI render (volumetric 3D shading, soft global light, rendered skin and hair)? false for flat 2D, cel-shaded or vector cartoon, line art, comic, anime, watercolor, painterly, sketch, storybook drawing or a photo.\n";

// AVATAR_STYLE_CUTOFF stories: the hero is drawn in the avatar's own (often more lifelike) 3D style and the
// cast in Pixar style. The picture must still be a full 3D CGI render — flat 2D, painterly or a real photo
// still fail (same pixar_3d / photo_realistic answers, so the mandatory check is never weaker).
export const AVATAR_STYLE_3D_QUESTION =
  "- pixar_3d: is the picture a polished full 3D CGI animated-film render (volumetric 3D shading, soft global light, rendered skin and hair)? The main child may be rendered more lifelike than cartoon companions, like a detailed 3D avatar — that still counts as true. false for flat 2D, cel-shaded or vector cartoon, line art, comic, anime, watercolor, painterly, sketch, storybook drawing or a real photo.\n";
export const AVATAR_STYLE_PHOTO_QUESTION =
  "- photo_realistic: does it look like a real camera photograph of real people rather than a CGI render? A detailed, lifelike 3D CGI render is NOT a photograph.\n";

/** pixar_3d + photo_realistic questions; avatarStyle only for AVATAR_STYLE_CUTOFF stories. */
export function styleQuestions(avatarStyle = false): string {
  return avatarStyle
    ? AVATAR_STYLE_3D_QUESTION + AVATAR_STYLE_PHOTO_QUESTION
    : PIXAR_3D_QUESTION + "- photo_realistic: does it look like a real photograph or a photorealistic image of real people?\n";
}

/** Avatar-style comparison of the hero with the face reference (AVATAR_STYLE_CUTOFF stories). */
export function avatarStyleQuestions(page: string, ref: string): string {
  return `- avatar_style_match: is the main child in ${page} rendered in the same 3D style as in ${ref} — same level of realism, proportions, eye size and head size? false if the child was turned into a noticeably more cartoonish character than in ${ref}.\n` +
    `- avatar_blend: does the main child in ${page} share the scene's light, shadows and color grading so the child belongs in the picture? false if the child looks cut out and pasted in.\n`;
}

/** Style problems from a check answer: not 3D Pixar, or photo-realistic. */
export function styleProblemsFrom(p: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (p.pixar_3d === false) out.push(STYLE_PROBLEM);
  if (p.photo_realistic === true) out.push("realistic style");
  return out;
}

export function hasStyleProblem(problems: string[]): boolean {
  return problems.includes(STYLE_PROBLEM) || problems.includes("realistic style");
}

/** Style fix for AVATAR_STYLE_CUTOFF stories: full 3D CGI, hero in the avatar's style, cast in Pixar style. */
export const AVATAR_STYLE_FIX_INSTRUCTION =
  "STYLE FIX (the previous attempt was NOT a polished 3D CGI render): this picture MUST be one full 3D CGI animated-film frame — volumetric 3D shapes, soft global illumination, rendered skin with subsurface scattering, individually rendered hair strands, depth and soft shadows. The main child keeps the 3D render style of the face reference picture; companions keep their official Pixar look; one shared light. NEVER flat 2D, cel-shaded, vector, line art, comic, anime, watercolor, painterly, sketch or a real photograph.";

export const STYLE_FIX_INSTRUCTION =
  "STYLE FIX (the previous attempt was NOT a 3D Pixar render): this picture MUST be a full 3D CGI render exactly like a Pixar/Disney animated feature film frame — volumetric 3D shapes, soft global illumination, rendered skin with subsurface scattering, individually rendered hair strands, depth and soft shadows. NEVER flat 2D, cel-shaded, vector, line art, comic, anime, watercolor, painterly, sketch or a photo.";

/** Problems of a redraw: style, plus face/age/hair against the face reference picture. */
export function redrawProblemsFrom(p: Record<string, unknown>, opts: { hasFace: boolean; allowText?: boolean }): string[] {
  const out = styleProblemsFrom(p);
  if (opts.hasFace) {
    if (p.avatar_face_match === false) out.push("avatar face");
    if (p.avatar_age_match === false) out.push("avatar age");
    if (p.avatar_hair_match === false) out.push("avatar hair");
    if (p.avatar_features_match === false) out.push("avatar features");
    if (p.avatar_style_match === false) out.push("avatar style");
    if (p.avatar_blend === false) out.push("avatar blend");
  }
  if (!opts.allowText && p.has_text === true) out.push("text in image");
  return out;
}

/** Correction text for the next redraw. */
export function redrawFixInstruction(problems: string[], opts: { age?: string; hair?: string; features?: string[]; format?: string | null; avatarStyle?: boolean; clothesOutfit?: string | null } = {}): string {
  const parts: string[] = [];
  if (problems.includes(SHAPE_PROBLEM)) parts.push(shapeFixInstruction(opts.format));
  if (hasStyleProblem(problems)) parts.push(opts.avatarStyle ? AVATAR_STYLE_FIX_INSTRUCTION : STYLE_FIX_INSTRUCTION);
  const face: string[] = [];
  if (problems.includes("avatar face") || problems.includes("different child")) face.push("the face must be the exact child in the face reference picture — same face shape, eyes, nose, mouth and cheeks");
  if (problems.includes("avatar age")) face.push(`the child must look ${opts.age ? `exactly ${opts.age} years old` : "the same age as in the face reference picture"}`);
  if (problems.includes("avatar hair")) face.push(`hair exactly ${opts.hair || "as in the face reference picture"} — same shade, length and hairstyle as the face reference picture`);
  if (problems.includes("avatar features")) face.push(`keep the child's distinguishing features${opts.features?.length ? `: ${opts.features.join("; ")}` : " from the face reference picture"}`);
  if (problems.includes("avatar style")) face.push(AVATAR_STYLE_FACE_FIX);
  if (problems.includes("avatar blend")) face.push(AVATAR_BLEND_FIX);
  if (face.length) parts.push(`FACE FIX (the previous attempt did not match the face reference picture): ${face.join("; ")}.`);
  if (problems.includes("text in image")) parts.push("TEXT FIX: no letters, words, captions or signs anywhere in the picture.");
  // Short-instruction stories: clothes of the hero / gang and foreign flags.
  const clothes = clothesFixInstruction(problems, opts.clothesOutfit);
  if (clothes) parts.push(clothes);
  return parts.join("\n");
}

export interface RedrawTry { problems: string[] }

export type RedrawDecision =
  | { action: "save"; index: number }
  | { action: "keep_old" }
  | { action: "save_closest"; index: number; identityCheck: string }
  | { action: "hold" };

/**
 * After the tries of a redraw: a passing try is saved; otherwise the previous picture stays.
 * A page that had no picture: page 1 keeps the closest try (locked rule: never empty — a try without
 * a style problem is preferred) and the story needs attention; pages 2+ stay empty for the admin.
 */
export function redrawDecision(tries: RedrawTry[], opts: { hadExisting: boolean; pageNumber: number }): RedrawDecision {
  const ok = tries.findIndex((t) => t.problems.length === 0);
  if (ok >= 0) return { action: "save", index: ok };
  if (opts.hadExisting || tries.length === 0) return tries.length === 0 && !opts.hadExisting ? { action: "hold" } : { action: "keep_old" };
  if (opts.pageNumber !== 1) return { action: "hold" };
  const index = closestTryIndex(tries);
  // Never save a flat 2D / photo try as the closest one.
  if (hasStyleProblem(tries[index].problems)) return { action: "hold" };
  return { action: "save_closest", index, identityCheck: `${LOOK_KEPT_PREFIX}: ${tries[index].problems.join(", ")}`.slice(0, 300) };
}

/** Adds "wrong shape" when the picture's real size doesn't match the story's shape (no AI call). */
export function shapeProblems(image: string | Uint8Array, format: string | null | undefined): string[] {
  return shapeMatches(format, imageSize(image)) ? [] : [SHAPE_PROBLEM];
}

/** Fewest problems, preferring tries that passed the style check. */
export function closestTryIndex(tries: RedrawTry[]): number {
  let best = -1;
  const score = (t: RedrawTry) => (hasStyleProblem(t.problems) ? 100 : 0) + t.problems.length;
  tries.forEach((t, i) => { if (best < 0 || score(t) < score(tries[best])) best = i; });
  return best;
}

/**
 * Vision check of a redraw: 3D Pixar style, and with a face picture the same
 * face/age/hair. Asked twice when the first call cannot run; null = the check could not run.
 */
export async function checkRedrawPicture(
  imageUrl: string,
  faceUrl: string | null,
  apiKey: string,
  opts: { age?: string; hair?: string; allowText?: boolean; features?: string[]; format?: string | null; avatarStyle?: boolean; clothes?: ClothesCheck | null } = {},
): Promise<{ problems: string[]; reason: string } | null> {
  const hasFace = !!faceUrl;
  const avatarStyle = !!opts.avatarStyle && hasFace;
  const shape = opts.format !== undefined ? shapeProblems(imageUrl, opts.format) : [];
  const feats = (opts.features || []).filter(Boolean);
  // Clothes questions need the avatar as Image A (short-instruction stories only).
  const clothes = hasFace ? opts.clothes ?? null : null;
  const text =
    (hasFace ? "Image A is the child's face reference picture. Image B is a new page of a children's book about this child. Answer about Image B" : "Answer about this children's book picture") +
    " (ignore clothes, pose and background):\n" +
    styleQuestions(avatarStyle) +
    (clothes
      ? "- has_text: are there clearly readable letters or words drawn in the picture, in any language (English/Latin letters included)? Toy blocks, logos and patterns are NOT text.\n"
      : "- has_text: are there clearly readable letters or words drawn in the picture? Toy blocks, logos and patterns are NOT text.\n") +
    (hasFace
      ? "- avatar_face_match: is the main child in B clearly the same child as in A (face shape, eyes, nose, mouth, cheeks)? Be strict; false if it looks like a different child.\n" +
        `- avatar_age_match: does the main child look ${opts.age ? `about ${opts.age} years old,` : ""} the same age as in A? false if clearly younger or older.\n` +
        `- avatar_hair_match: is the hair the same shade, length and hairstyle as in A${opts.hair ? ` (expected: ${opts.hair})` : ""}? false if clearly different.\n` +
        (feats.length ? `- avatar_features_match: does the main child in B keep most of these features of A: ${feats.join("; ")}? false if two or more are clearly missing or different.\n` : "") +
        (avatarStyle ? avatarStyleQuestions("B", "A") : "") +
        (clothes ? `Now look at the clothes and objects of Image B (clothes do count for these):\n${clothesCheckQuestions("Image B", "Image A", clothes)}` : "")
      : "") +
    `Answer strict JSON only: {"pixar_3d":bool,"photo_realistic":bool,"has_text":bool,"avatar_face_match":bool,"avatar_age_match":bool,"avatar_hair_match":bool,"avatar_features_match":bool,${avatarStyle ? '"avatar_style_match":bool,"avatar_blend":bool,' : ""}${clothes ? '"hero_clothes_ok":bool,"gang_clothes_ok":bool,"foreign_flag":bool,' : ""}"reason":"<max 15 words>"}`;
  const content: any[] = [{ type: "text", text }];
  if (faceUrl) content.push({ type: "image_url", image_url: { url: faceUrl } });
  content.push({ type: "image_url", image_url: { url: imageUrl } });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(40_000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3.8-flash", messages: [{ role: "user", content }] }),
      });
      if (!res.ok) { await res.text().catch(() => ""); continue; }
      const raw: string = (await res.json())?.choices?.[0]?.message?.content ?? "";
      const j = raw.replace(/```json|```/g, "");
      const s = j.indexOf("{"), e = j.lastIndexOf("}");
      if (s < 0 || e < 0) continue;
      const p = JSON.parse(j.slice(s, e + 1));
      if (!feats.length) delete p.avatar_features_match;
      if (!avatarStyle) { delete p.avatar_style_match; delete p.avatar_blend; }
      const problems = [...redrawProblemsFrom(p, { hasFace, allowText: opts.allowText }), ...(clothes ? clothesProblemsFrom(p, clothes) : []), ...shape];
      return { problems, reason: `${problems.join(", ")}${p.reason ? ` (${String(p.reason).slice(0, 100)})` : ""}` || "ok" };
    } catch (err) {
      console.warn("[STYLE-CHECK] failed:", (err as Error)?.message);
    }
  }
  return null;
}
