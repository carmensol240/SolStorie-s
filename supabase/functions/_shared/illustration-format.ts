// Square (1:1) illustrations for new stories, behind a server switch.
// SQUARE_ILLUSTRATIONS secret: "on" = every new story, "test" = only stories of admin accounts,
// anything else / missing = off (today's landscape pictures, unchanged).

export type IllustrationFormat = "landscape" | "square";

/** Marker text inside the square rule — the backup image service reads it to request a square size. */
export const SQUARE_MARK = "SQUARE 1:1 FORMAT";

export const SQUARE_FORMAT_RULE =
  `${SQUARE_MARK}: Create a perfectly SQUARE image (1:1 aspect ratio, equal width and height). ` +
  `Compose the scene for a square book page: the main character and the action are centered, full scene visible, ` +
  `with comfortable margin on every side (nothing important within 6% of any edge — the page is trimmed a little when printed). ` +
  `Fill the whole square with the scene and background; no borders, frames, letterbox bars or empty bands.`;

export type SwitchMode = "off" | "test" | "on";

export function readSwitch(raw: string | undefined | null): SwitchMode {
  const v = String(raw ?? "").trim().toLowerCase();
  return v === "on" ? "on" : v === "test" ? "test" : "off";
}

/** Format for a NEW story, decided once when the story is created. */
export function decideFormat(mode: SwitchMode, ownerIsAdmin: boolean): IllustrationFormat {
  if (mode === "on") return "square";
  if (mode === "test" && ownerIsAdmin) return "square";
  return "landscape";
}

/** Text appended to every drawing prompt of a square story (empty for landscape). */
export function formatRule(format: string | null | undefined): string {
  return format === "square" ? `\n\n${SQUARE_FORMAT_RULE}` : "";
}

/** Size requested from the backup image service. */
export function backupSizeFor(prompt: string): string {
  return prompt.includes(SQUARE_MARK) ? "1024x1024" : "1536x1024";
}
