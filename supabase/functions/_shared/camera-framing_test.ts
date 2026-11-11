import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { pickFramingAngle, framingComposition, usesConsistentFraming, LEGACY_CAMERA_ANGLES, CONSISTENT_CAMERA_ANGLES } from "./camera-framing.ts";

Deno.test("new story never gets bird's eye, low angle, wide or face close-up", () => {
  for (let p = 1; p <= 24; p++) for (const off of [0, 3]) {
    const a = pickFramingAngle(p, 12, off, true).toLowerCase();
    for (const banned of ["bird", "low angle", "wide", "close-up"]) assert(!a.includes(banned), `${p}/${off}: ${a}`);
  }
});
Deno.test("old story keeps the original rotation", () => {
  assertEquals(pickFramingAngle(3, 12, 0, false), LEGACY_CAMERA_ANGLES[3]);
  assertEquals(pickFramingAngle(12, 12, 0, false), LEGACY_CAMERA_ANGLES[2]);
});
Deno.test("cutoff: stories before it are old, after it are new", () => {
  assertEquals(usesConsistentFraming("2026-11-01T00:00:00Z"), false);
  assertEquals(usesConsistentFraming("2026-11-12T00:00:00Z"), true);
});

Deno.test("closer framing: never bird's eye, low angle, wide or face close-up", () => {
  for (let p = 1; p <= 24; p++) for (const off of [0, 3]) {
    const a = pickFramingAngle(p, 12, off, true, true).toLowerCase();
    for (const banned of ["bird", "low angle", "wide", "close-up"]) assert(!a.includes(banned), `${p}/${off}: ${a}`);
    assert(a.includes("eye level"), a);
  }
});
Deno.test("closer framing: waist-up on 2 of every 3 pages, hero half to 60% of the height", () => {
  let waist = 0;
  for (let p = 1; p <= 12; p++) if (pickFramingAngle(p, 12, 0, true, true).includes("waist up")) waist++;
  assertEquals(waist, 8);
  const rule = framingComposition(pickFramingAngle(1, 12, 0, true, true), true, true);
  assert(rule.includes("half to 60% of the image height"), rule);
  assert(rule.includes("eye level"), rule);
});
Deno.test("stories before the likeness cutoff keep the 3 eye-level framings", () => {
  assertEquals(pickFramingAngle(2, 12, 0, true, false), CONSISTENT_CAMERA_ANGLES[2]);
  assert(framingComposition(CONSISTENT_CAMERA_ANGLES[0], true).includes("about half of the image height"));
});
