import {
  finishCleanColoringImage,
  inspectColoringImage,
  lineArtFromFailedPage,
  outlinesFromIllustration,
} from "./coloring-image.ts";

export const COLORING_MAX_RETRIES = 2;
export const COLORING_RETRY_INSTRUCTION =
  "CRITICAL CORRECTION: clean coloring book line art: thin black outlines only, pure white background and fills, no color, no gray, no solid black areas, no shading, no filled hair or shadows.";

interface Options {
  first: string;
  regenerate: () => Promise<string | undefined>;
  imageBytes: (url: string) => Promise<Uint8Array>;
  original: Uint8Array;
}

/**
 * Checks each AI page (color > 1%, black > 8%, solid black area > 2%), regenerates up
 * to COLORING_MAX_RETRIES times, then falls back to edge-detected outlines of the
 * original illustration. Never saves a page through a plain threshold unless it passed.
 */
export async function produceCleanColoringPage({ first, regenerate, imageBytes, original }: Options): Promise<Uint8Array> {
  let lastFailed: Awaited<ReturnType<typeof inspectColoringImage>>["image"] | null = null;
  for (let attempt = 0; attempt <= COLORING_MAX_RETRIES; attempt++) {
    const url = attempt === 0 ? first : await regenerate();
    if (!url) break;
    try {
      const { image, report } = await inspectColoringImage(await imageBytes(url));
      console.log(`Coloring check attempt ${attempt + 1}:`, JSON.stringify(report));
      if (report.clean) return await finishCleanColoringImage(image);
      lastFailed = image;
    } catch (e) {
      console.warn(`Coloring check attempt ${attempt + 1} failed to read image`, e);
    }
  }
  try {
    console.log("Coloring: AI pages failed the checks, using outlines from the original illustration");
    return await outlinesFromIllustration(original);
  } catch (e) {
    console.warn("Outline extraction from original failed", e);
  }
  if (lastFailed) return await lineArtFromFailedPage(lastFailed);
  throw new Error("No usable coloring page");
}
