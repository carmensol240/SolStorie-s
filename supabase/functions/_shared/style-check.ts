// Mandatory "3D Pixar" check on every drawing (first drawings, redraws, admin redraws) and,
// on redraws, a face check against the child's face reference picture (avatar).
// A failed picture is redrawn with a correction, up to MAX_STYLE_REDRAWS times. If it still fails,
// the previous picture stays (or, for a page that had none, see redrawDecision) and the admin is alerted.
import { LOOK_KEPT_PREFIX } from "./look-check.ts";
import { imageSize, shapeMatches, shapeFixInstruction, SHAPE_PROBLEM } from "./illustration-format.ts";

export const STYLE_PROBLEM = "not 3D Pixar";
export const MAX_STYLE_REDRAWS = 2;

/** The style question asked in every picture check. */
export const PIXAR_3D_QUESTION =
  "- pixar_3d: is the picture a polished Pixar/Disney-like full 3D CGI render (volumetric 3D shading, soft global light, rendered skin and hair)? false for flat 2D, cel-shaded or vector cartoon, line art, comic, anime, watercolor, painterly, sketch, storybook drawing or a photo.\n";

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
  }
  if (!opts.allowText && p.has_text === true) out.push("text in image");
  return out;
}

/** Correction text for the next redraw. */
export function redrawFixInstruction(problems: string[], opts: { age?: string; hair?: string; features?: string[]; format?: string | null } = {}): string {
  const parts: string[] = [];
  if (problems.includes(SHAPE_PROBLEM)) parts.push(shapeFixInstruction(opts.format));
  if (hasStyleProblem(problems)) parts.push(STYLE_FIX_INSTRUCTION);
  const face: string[] = [];
  if (problems.includes("avatar face") || problems.includes("different child")) face.push("the face must be the exact child in the face reference picture — same face shape, eyes, nose, mouth and cheeks");
  if (problems.includes("avatar age")) face.push(`the child must look ${opts.age ? `exactly ${opts.age} years old` : "the same age as in the face reference picture"}`);
  if (problems.includes("avatar hair")) face.push(`hair exactly ${opts.hair || "as in the face reference picture"} — same shade, length and hairstyle as the face reference picture`);
  if (problems.includes("avatar features")) face.push(`keep the child's distinguishing features${opts.features?.length ? `: ${opts.features.join("; ")}` : " from the face reference picture"}`);
  if (face.length) parts.push(`FACE FIX (the previous attempt did not match the face reference picture): ${face.join("; ")}.`);
  if (problems.includes("text in image")) parts.push("TEXT FIX: no letters, words, captions or signs anywhere in the picture.");
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
  opts: { age?: string; hair?: string; allowText?: boolean; features?: string[]; format?: string | null } = {},
): Promise<{ problems: string[]; reason: string } | null> {
  const hasFace = !!faceUrl;
  const shape = opts.format !== undefined ? shapeProblems(imageUrl, opts.format) : [];
  const feats = (opts.features || []).filter(Boolean);
  const text =
    (hasFace ? "Image A is the child's face reference picture. Image B is a new page of a children's book about this child. Answer about Image B" : "Answer about this children's book picture") +
    " (ignore clothes, pose and background):\n" +
    PIXAR_3D_QUESTION +
    "- photo_realistic: does it look like a real photograph or a photorealistic image of real people?\n" +
    "- has_text: are there clearly readable letters or words drawn in the picture? Toy blocks, logos and patterns are NOT text.\n" +
    (hasFace
      ? "- avatar_face_match: is the main child in B clearly the same child as in A (face shape, eyes, nose, mouth, cheeks)? Be strict; false if it looks like a different child.\n" +
        `- avatar_age_match: does the main child look ${opts.age ? `about ${opts.age} years old,` : ""} the same age as in A? false if clearly younger or older.\n` +
        `- avatar_hair_match: is the hair the same shade, length and hairstyle as in A${opts.hair ? ` (expected: ${opts.hair})` : ""}? false if clearly different.\n` +
        (feats.length ? `- avatar_features_match: does the main child in B keep most of these features of A: ${feats.join("; ")}? false if two or more are clearly missing or different.\n` : "")
      : "") +
    'Answer strict JSON only: {"pixar_3d":bool,"photo_realistic":bool,"has_text":bool,"avatar_face_match":bool,"avatar_age_match":bool,"avatar_hair_match":bool,"avatar_features_match":bool,"reason":"<max 15 words>"}';
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
      const problems = [...redrawProblemsFrom(p, { hasFace, allowText: opts.allowText }), ...shape];
      return { problems, reason: `${problems.join(", ")}${p.reason ? ` (${String(p.reason).slice(0, 100)})` : ""}` || "ok" };
    } catch (err) {
      console.warn("[STYLE-CHECK] failed:", (err as Error)?.message);
    }
  }
  return null;
}
