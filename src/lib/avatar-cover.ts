// New stories (server AVATAR_COVER_CUTOFF): the cover is a frozen copy of the child's drawn avatar,
// shown whole and untouched — never cropped, never with text or frames on it. Page 1 stays a scene.
export const AVATAR_COVER_FILE = 'cover-avatar.png';

export function isAvatarCoverUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.split('?')[0].endsWith(`/${AVATAR_COVER_FILE}`);
}

/** Size of an image of ratio w/h fitted whole inside a box (contain, never stretched). */
export function containFit(imgW: number, imgH: number, boxW: number, boxH: number): { w: number; h: number } {
  const k = Math.min(boxW / imgW, boxH / imgH);
  return { w: imgW * k, h: imgH * k };
}

/** Card/thumbnail fit: an avatar cover is shown whole on paper; other covers keep filling the frame. */
export function coverFitClass(url: string | null | undefined): string {
  return isAvatarCoverUrl(url) ? 'object-contain bg-paper' : 'object-cover';
}
