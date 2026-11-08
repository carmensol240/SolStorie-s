/**
 * Ages 0–4 on a portrait phone (text-on-picture pages).
 * - "cover": the picture fills the whole card (cropped from the center) and the text sits on it
 *   at the bottom over a dark fade.
 * - "stacked": the text block would cover more than a third of the picture, so the whole picture
 *   is shown on top (full width, not cropped) and the text below it on a plain background;
 *   the card is only as tall as its content.
 */
export type PhonePictureLayout = "cover" | "stacked";

/** Largest share of the card the text may cover before switching to the stacked layout. */
export const MAX_TEXT_SHARE_ON_PICTURE = 1 / 3;

/** In the stacked layout the picture keeps at least this share of the card, even with very long text. */
export const MIN_STACKED_PICTURE_SHARE = 0.4;

/**
 * Picture height (px) in the stacked layout: the full-width height of the whole picture,
 * shrunk (never cropped) only when a tall picture would push the text off the card.
 * Returns 0 when sizes are not known yet.
 */
export function stackedPictureHeight(opts: { cardWidth: number; cardHeight: number; ratio: number; textHeight: number }): number {
  const { cardWidth, cardHeight, ratio, textHeight } = opts;
  if (!(cardWidth > 0) || !(cardHeight > 0) || !(ratio > 0)) return 0;
  const fullWidth = cardWidth / ratio;
  const roomLeft = Math.max(cardHeight - Math.max(0, textHeight), cardHeight * MIN_STACKED_PICTURE_SHARE);
  return Math.round(Math.min(fullWidth, roomLeft));
}

export function choosePhonePictureLayout(textBlockHeight: number, cardHeight: number): PhonePictureLayout {
  if (!(cardHeight > 0) || !(textBlockHeight > 0)) return "cover";
  return textBlockHeight > cardHeight * MAX_TEXT_SHARE_ON_PICTURE ? "stacked" : "cover";
}
