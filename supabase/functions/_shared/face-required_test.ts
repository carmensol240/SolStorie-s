import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { hasFaceSource } from "./face-required.ts";

Deno.test("no photo, no avatar, no saved child face → refused", () => {
  assertEquals(hasFaceSource(null, null, null), false);
  assertEquals(hasFaceSource("", " ", { avatar_url: null, photo_url: "" }), false);
});
Deno.test("new photo, sent avatar, or saved child face → allowed", () => {
  assertEquals(hasFaceSource("data:image/jpeg;base64,AA", null, null), true);
  assertEquals(hasFaceSource(null, "uid/avatar.png", null), true);
  assertEquals(hasFaceSource(null, null, { avatar_url: "uid/a.png" }), true);
  assertEquals(hasFaceSource(null, null, { photo_url: "uid/p.jpg" }), true);
});
