/**
 * Step 2 rule: a usable face is required.
 * - a new photo + consent, or
 * - a saved child profile that already has avatar_url or photo_url.
 */
export function canProceedWithPhoto(
  photo: string | null | undefined,
  consent: boolean,
  savedProfileHasFace = false,
): boolean {
  if (savedProfileHasFace) return true;
  const hasPhoto = typeof photo === "string" && photo.trim().length > 0;
  return hasPhoto && consent;
}
