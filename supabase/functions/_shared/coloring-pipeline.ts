import { finishCleanColoringImage, inspectColoringImage } from "./coloring-image.ts";

/** Retries with the correction instruction after a failed first page. */
export const COLORING_MAX_RETRIES = 2;
export const COLORING_RETRY_INSTRUCTION =
  "CRITICAL CORRECTION: clean coloring book line art: thin black outlines only, pure white background and fills, no color, no gray, no solid black areas, no shading, no filled hair or shadows.";
export const COLORING_FAILED_MESSAGE = "לא הצלחנו ליצור דף צביעה הפעם, נסו שוב בעוד רגע";

interface Options {
  /** First AI page (original prompt). */
  first: string;
  /** Regenerates with the original prompt + COLORING_RETRY_INSTRUCTION. */
  regenerate: () => Promise<string | undefined>;
  /** Last attempt: same model and the same original prompt as the first page. */
  lastAttempt: () => Promise<string | undefined>;
  imageBytes: (url: string) => Promise<Uint8Array>;
}

/**
 * Checks each AI page (colored pixels > 1% or a solid black area > 2% fail).
 * Order: first page → up to 2 corrected retries → one more with the original prompt.
 * Returns null when every attempt fails: nothing is saved and nothing is charged.
 * No edge-detection or threshold fallback ever produces a saved page.
 */
export async function produceCleanColoringPage({ first, regenerate, lastAttempt, imageBytes }: Options): Promise<Uint8Array | null> {
  const total = COLORING_MAX_RETRIES + 2;
  for (let attempt = 0; attempt < total; attempt++) {
    const url = attempt === 0 ? first : attempt === total - 1 ? await lastAttempt() : await regenerate();
    if (!url) continue;
    try {
      const { image, report } = await inspectColoringImage(await imageBytes(url));
      console.log(`Coloring check attempt ${attempt + 1}:`, JSON.stringify(report));
      if (report.clean) return await finishCleanColoringImage(image);
    } catch (e) {
      console.warn(`Coloring check attempt ${attempt + 1} failed to read image`, e);
    }
  }
  console.warn("Coloring: every attempt failed the checks, nothing saved");
  return null;
}
