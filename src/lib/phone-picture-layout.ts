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

export function choosePhonePictureLayout(textBlockHeight: number, cardHeight: number): PhonePictureLayout {
  if (!(cardHeight > 0) || !(textBlockHeight > 0)) return "cover";
  return textBlockHeight > cardHeight * MAX_TEXT_SHARE_ON_PICTURE ? "stacked" : "cover";
}
