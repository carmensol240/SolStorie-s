import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { AVATAR_COVER_CUTOFF, avatarCoverBytes, avatarCoverPath, isAvatarCoverUrl, usesAvatarCover } from "./avatar-cover.ts";

function pngDataUrl(size = 2000): string {
  const b = new Uint8Array(size);
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].forEach((v, i) => (b[i] = v));
  let s = ""; for (const x of b) s += String.fromCharCode(x);
  return `data:image/png;base64,${btoa(s)}`;
}

Deno.test("only stories created from the cutoff get the avatar cover; existing stories keep theirs", () => {
  assertEquals(usesAvatarCover("2026-11-11T16:41:34Z"), false); // e.g. Uriel's existing story
  assertEquals(usesAvatarCover(AVATAR_COVER_CUTOFF), true);
  assertEquals(usesAvatarCover("2026-12-01T10:00:00Z"), true);
  assertEquals(usesAvatarCover(null), false);
});

Deno.test("the drawn PNG avatar is published byte-for-byte (no crop, resize or re-encode)", () => {
  const url = pngDataUrl();
  const r = avatarCoverBytes(url);
  assert("bytes" in r);
  const back = btoa(String.fromCharCode(...r.bytes));
  assertEquals(`data:image/png;base64,${back}`, url);
});

Deno.test("a JPEG / remote / storage-path picture (possibly the real photo) is never published", () => {
  assertEquals((avatarCoverBytes("data:image/jpeg;base64,/9j/4AAQ") as any).reason, "not_png_data_url");
  assertEquals((avatarCoverBytes("https://x/y.png") as any).reason, "not_png_data_url");
  assertEquals((avatarCoverBytes("temp-refs/u/1.png") as any).reason, "not_png_data_url");
  assertEquals((avatarCoverBytes(null) as any).reason, "no_avatar");
  const fake = `data:image/png;base64,${btoa("x".repeat(2000))}`;
  assertEquals((avatarCoverBytes(fake) as any).reason, "not_png_bytes");
});

Deno.test("page 1 can tell an avatar cover apart and never overwrites it", () => {
  const u = `https://h/storage/v1/object/public/story-illustrations/${avatarCoverPath("abc")}?v=1`;
  assertEquals(isAvatarCoverUrl(u), true);
  assertEquals(isAvatarCoverUrl("https://h/story-illustrations/abc/page-1.png?v=1"), false);
  assertEquals(isAvatarCoverUrl(null), false);
});
