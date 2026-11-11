import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { pickFramingAngle, usesConsistentFraming, LEGACY_CAMERA_ANGLES } from "./camera-framing.ts";

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
