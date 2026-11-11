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
  if (format === "square") return `\n\n${SQUARE_FORMAT_RULE}`;
  if (format === "portrait") return `\n\n${PORTRAIT_FORMAT_RULE}`;
  return `\n\n${LANDSCAPE_FORMAT_RULE}`;
}

/** Marker text inside the landscape rule. */
export const LANDSCAPE_MARK = "LANDSCAPE 3:2 FORMAT";
export const LANDSCAPE_FORMAT_RULE =
  `${LANDSCAPE_MARK}: Create a WIDE horizontal image (3:2 aspect ratio, width about 1.5 times the height) — never tall or portrait, ` +
  `even though the reference pictures may be tall. Fill the whole width with the scene; no borders, frames or empty bands.`;
export const PORTRAIT_FORMAT_RULE =
  "PORTRAIT 2:3 FORMAT: Create a TALL vertical image (2:3 aspect ratio, height about 1.5 times the width). Fill the whole picture with the scene; no borders or empty bands.";

/** Width/height of a PNG, JPEG or WebP picture (data URL, base64 or bytes); null if unknown. */
export function imageSize(input: string | Uint8Array): { width: number; height: number } | null {
  let b: Uint8Array;
  if (typeof input === "string") {
    const raw = input.includes(",") ? input.split(",")[1] : input;
    try {
      const head = raw.slice(0, 200_000).replace(/[^A-Za-z0-9+/]/g, "");
      const bin = atob(head.slice(0, head.length - (head.length % 4)));
      b = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    } catch { return null; }
  } else b = input;
  const u32 = (o: number) => (b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0;
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { width: u32(16), height: u32(20) };
  if (b.length > 30 && b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57) { // WebP
    const kind = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (kind === "VP8 ") return { width: (b[26] | b[27] << 8) & 0x3fff, height: (b[28] | b[29] << 8) & 0x3fff };
    if (kind === "VP8L") { const v = b[21] | b[22] << 8 | b[23] << 16 | b[24] << 24; return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === "VP8X") return { width: 1 + (b[24] | b[25] << 8 | b[26] << 16), height: 1 + (b[27] | b[28] << 8 | b[29] << 16) };
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) { // JPEG: find SOF marker
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) { o++; continue; }
      const m = b[o + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: b[o + 7] << 8 | b[o + 8], height: b[o + 5] << 8 | b[o + 6] };
      o += 2 + (b[o + 2] << 8 | b[o + 3]);
    }
  }
  return null;
}

/** Does a picture of this size have the story's shape? Unknown size never fails. */
export function shapeMatches(format: string | null | undefined, size: { width: number; height: number } | null): boolean {
  if (!size || !size.width || !size.height) return true;
  const r = size.width / size.height;
  if (format === "square") return r >= 0.9 && r <= 1.1;
  if (format === "portrait") return r <= 0.83;
  return r >= 1.2; // landscape (default)
}

export const SHAPE_PROBLEM = "wrong shape";

/** Correction text after a picture came out in the wrong shape. */
export function shapeFixInstruction(format: string | null | undefined): string {
  const want = format === "square" ? "a perfectly SQUARE 1:1 image" : format === "portrait" ? "a TALL 2:3 portrait image" : "a WIDE 3:2 landscape image (wider than tall)";
  return `SHAPE FIX (the previous attempt had the wrong shape): the picture MUST be ${want}. Ignore the shape of the reference pictures.`;
}

/** Size requested from the backup image service. */
export function backupSizeFor(prompt: string): string {
  return prompt.includes(SQUARE_MARK) ? "1024x1024" : "1536x1024";
}
