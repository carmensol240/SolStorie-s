import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { decodeColoringImage, inspectColoringImage } from "../_shared/coloring-image.ts";
import { produceCleanColoringPage } from "../_shared/coloring-pipeline.ts";

const dataUrl = async (img: Image) => {
  const bytes = await img.encode();
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return `data:image/png;base64,${btoa(s)}`;
};
const bytesOf = (url: string) => Promise.resolve(Uint8Array.from(atob(url.split(",")[1]), (c) => c.charCodeAt(0)));

function page(fillBlack: boolean) {
  const img = new Image(200, 200);
  img.fill(0xffffffff);
  for (let x = 1; x <= 200; x++) img.setPixelAt(x, 20, 0x000000ff);
  if (fillBlack) for (let y = 50; y <= 120; y++) for (let x = 50; x <= 120; x++) img.setPixelAt(x, y, 0x000000ff);
  return img;
}

Deno.test("a page with a solid black area is regenerated and a clean retry is used", async () => {
  let calls = 0;
  const clean = await dataUrl(page(false));
  const out = await produceCleanColoringPage({
    first: await dataUrl(page(true)),
    regenerate: async () => { calls++; return clean; },
    lastAttempt: async () => { throw new Error("not needed"); },
    imageBytes: bytesOf,
  });
  assertEquals(calls, 1);
  const decoded = await decodeColoringImage(out!);
  assertEquals(decoded.getPixelAt(100, 100), 0xffffffff);
});

Deno.test("after 2 failed retries, a third attempt with the original prompt is used", async () => {
  let retries = 0, last = 0;
  const bad = await dataUrl(page(true));
  const clean = await dataUrl(page(false));
  const out = await produceCleanColoringPage({
    first: bad,
    regenerate: async () => { retries++; return bad; },
    lastAttempt: async () => { last++; return clean; },
    imageBytes: bytesOf,
  });
  assertEquals([retries, last], [2, 1]);
  const { report } = await inspectColoringImage(await (await decodeColoringImage(out!)).encode());
  assert(report.clean);
});

Deno.test("if every attempt fails, nothing is returned (no save, no charge)", async () => {
  const bad = await dataUrl(page(true));
  const out = await produceCleanColoringPage({
    first: bad,
    regenerate: async () => bad,
    lastAttempt: async () => bad,
    imageBytes: bytesOf,
  });
  assertEquals(out, null);
});
