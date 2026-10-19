import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { binarizeColoringPixels, inspectColoringPixels } from "./coloring-pixels.ts";

export async function decodeColoringImage(bytes: Uint8Array) {
  return await Image.decode(bytes);
}

/** Decodes an AI coloring page and runs both checks (colored pixels, solid black). */
export async function inspectColoringImage(bytes: Uint8Array) {
  const image = await decodeColoringImage(bytes);
  return { image, report: inspectColoringPixels(image.bitmap, image.width, image.height) };
}

/** A page that passed both checks: a plain threshold cannot create black blobs here. */
export async function finishCleanColoringImage(image: Image) {
  binarizeColoringPixels(image.bitmap);
  return await image.encode();
}
