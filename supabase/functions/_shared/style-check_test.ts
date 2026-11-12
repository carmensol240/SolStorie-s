import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { MAX_STYLE_REDRAWS, STYLE_PROBLEM, redrawDecision, redrawFixInstruction, redrawProblemsFrom, styleProblemsFrom } from "./style-check.ts";
import { coverProblemsFrom, keptTryAfterFailedRedraws } from "./cover-check.ts";

Deno.test("a flat 2D picture fails the mandatory 3D Pixar check", () => {
  assertEquals(styleProblemsFrom({ pixar_3d: false, photo_realistic: false }), [STYLE_PROBLEM]);
  assertEquals(styleProblemsFrom({ pixar_3d: true, photo_realistic: false }), []);
});

Deno.test("up to 2 redraws after a failed style check", () => {
  assertEquals(MAX_STYLE_REDRAWS, 2);
});

Deno.test("redraw: face, age and hair are checked against the avatar", () => {
  assertEquals(redrawProblemsFrom({ pixar_3d: true, avatar_face_match: false, avatar_age_match: false, avatar_hair_match: true }, { hasFace: true }),
    ["avatar face", "avatar age"]);
});

Deno.test("the redraw after a failed check gets a style fix and a face fix", () => {
  const fix = redrawFixInstruction([STYLE_PROBLEM, "avatar face", "avatar hair"], { age: "4", hair: "near-black very dark brown" });
  assert(fix.includes("STYLE FIX"));
  assert(fix.includes("FACE FIX"));
  assert(fix.includes("near-black very dark brown"));
});

Deno.test("a passing try is saved", () => {
  assertEquals(redrawDecision([{ problems: [STYLE_PROBLEM] }, { problems: [] }], { hadExisting: true, pageNumber: 3 }), { action: "save", index: 1 });
});

Deno.test("still failing after the redraws: the previous picture stays (also for an admin redraw of page 1)", () => {
  const tries = [{ problems: [STYLE_PROBLEM] }, { problems: [STYLE_PROBLEM] }, { problems: ["avatar face"] }];
  assertEquals(redrawDecision(tries, { hadExisting: true, pageNumber: 3 }), { action: "keep_old" });
  assertEquals(redrawDecision(tries, { hadExisting: true, pageNumber: 1 }), { action: "keep_old" });
});

Deno.test("page 1 with no picture is never left empty; a try that passed the style check is preferred", () => {
  const d = redrawDecision([{ problems: [STYLE_PROBLEM] }, { problems: ["avatar face", "avatar hair"] }], { hadExisting: false, pageNumber: 1 });
  assertEquals(d.action, "save_closest");
  assertEquals((d as any).index, 1);
  assertEquals(redrawDecision([{ problems: [STYLE_PROBLEM] }], { hadExisting: false, pageNumber: 4 }), { action: "hold" });
});

Deno.test("first-drawing cover: a flat picture is a problem and the kept cover prefers a 3D try", () => {
  assertEquals(coverProblemsFrom({ same_child: true, pixar_3d: false }, { hasAvatar: true }), [STYLE_PROBLEM]);
  const kept = keptTryAfterFailedRedraws(1, false, [
    { problems: [STYLE_PROBLEM], reason: "flat" },
    { problems: ["different child", "hair tone"], reason: "3d" },
  ]);
  assertEquals(kept?.best.reason, "3d");
});

Deno.test("likeness: a tall picture in a landscape book is a wrong shape and gets a shape fix", async () => {
  const { shapeProblems, redrawFixInstruction } = await import("./style-check.ts");
  const png = (w: number, h: number) => {
    const b = new Uint8Array(33); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    const dv = new DataView(b.buffer); dv.setUint32(16, w); dv.setUint32(20, h);
    let bin = ""; b.forEach((x) => bin += String.fromCharCode(x)); return `data:image/png;base64,${btoa(bin)}`;
  };
  if (shapeProblems(png(784, 1360), "landscape").join() !== "wrong shape") throw new Error("tall landscape passed");
  if (shapeProblems(png(1408, 768), "landscape").length) throw new Error("wide landscape failed");
  if (shapeProblems(png(1024, 1024), "square").length) throw new Error("square failed");
  if (!redrawFixInstruction(["wrong shape"], { format: "landscape" }).includes("3:2")) throw new Error("no shape fix");
});

Deno.test("likeness: missing distinguishing features fail the face check and are named in the fix", async () => {
  const { redrawProblemsFrom, redrawFixInstruction } = await import("./style-check.ts");
  const p = redrawProblemsFrom({ pixar_3d: true, avatar_features_match: false }, { hasFace: true });
  if (!p.includes("avatar features")) throw new Error("features not checked");
  if (!redrawFixInstruction(p, { features: ["no bangs"] }).includes("no bangs")) throw new Error("features not in fix");
});

Deno.test("avatar style stories: the mandatory 3D check is not weaker — flat 2D and real photos still fail", async () => {
  const { styleQuestions, AVATAR_STYLE_FIX_INSTRUCTION } = await import("./style-check.ts");
  const q = styleQuestions(true);
  for (const want of ["pixar_3d", "flat 2D", "watercolor", "real photo", "photo_realistic"]) assert(q.includes(want), want);
  assertEquals(styleProblemsFrom({ pixar_3d: false, photo_realistic: false }), [STYLE_PROBLEM]);
  assertEquals(styleProblemsFrom({ pixar_3d: true, photo_realistic: true }), ["realistic style"]);
  const fix = redrawFixInstruction([STYLE_PROBLEM], { avatarStyle: true });
  assertEquals(fix, AVATAR_STYLE_FIX_INSTRUCTION);
  assert(fix.includes("NEVER flat 2D") && fix.includes("real photograph"));
  assert(redrawFixInstruction([STYLE_PROBLEM]).includes("Pixar/Disney animated feature film"));
});

Deno.test("avatar style stories: a cartoonish or pasted-in hero is a face problem with a named fix", async () => {
  const { isLookOnly, lookProblemsFrom } = await import("./look-check.ts");
  const p = redrawProblemsFrom({ pixar_3d: true, avatar_style_match: false, avatar_blend: false }, { hasFace: true });
  assertEquals(p, ["avatar style", "avatar blend"]);
  assert(isLookOnly(p));
  assertEquals(lookProblemsFrom({ avatar_style_match: false }), ["avatar style"]);
  const fix = redrawFixInstruction(p, { avatarStyle: true });
  assert(fix.includes("more cartoonish") && fix.includes("pasted in"));
});
