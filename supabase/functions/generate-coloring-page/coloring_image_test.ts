import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { cleanColoringImage, decodeColoringImage } from "../_shared/coloring-image.ts";

Deno.test("encoded coloring output is pure opaque black/white at threshold 170", async () => {
  const image = new Image(3, 1);
  image.bitmap.set([255, 0, 0, 255, 169, 169, 169, 255, 170, 170, 170, 255]);
  const result = await cleanColoringImage(await image.encode());
  assertEquals(result.coloredFraction, 1 / 3);
  const decoded = await decodeColoringImage(result.bytes);
  assertEquals([...decoded.bitmap], [0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255]);
});