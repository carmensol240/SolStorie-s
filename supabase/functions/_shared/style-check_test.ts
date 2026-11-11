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
