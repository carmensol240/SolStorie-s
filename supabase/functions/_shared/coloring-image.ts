import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { binarizeColoringPixels, coloredPixelFraction } from "./coloring-pixels.ts";

export async function decodeColoringImage(bytes: Uint8Array) {
  return await Image.decode(bytes);
}

export async function cleanColoringImage(bytes: Uint8Array) {
  const image = await decodeColoringImage(bytes);
  const coloredFraction = coloredPixelFraction(image.bitmap);
  binarizeColoringPixels(image.bitmap);
  return { bytes: await image.encode(), coloredFraction };
}