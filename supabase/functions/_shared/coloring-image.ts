import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import {
  binarizeColoringPixels,
  extractOutlines,
  inspectColoringPixels,
  toLineArt,
} from "./coloring-pixels.ts";

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

/** Last resort for a failed AI page: keep thin lines only, never solid areas. */
export async function lineArtFromFailedPage(image: Image) {
  toLineArt(image.bitmap, image.width, image.height);
  return await image.encode();
}

/** Edge-detected outlines from the original color illustration. */
export async function outlinesFromIllustration(bytes: Uint8Array, longSide = 1600) {
  const image = await decodeColoringImage(bytes);
  const scale = longSide / Math.max(image.width, image.height);
  if (scale < 1) image.resize(Math.round(image.width * scale), Math.round(image.height * scale));
  extractOutlines(image.bitmap, image.width, image.height);
  return await image.encode();
}
