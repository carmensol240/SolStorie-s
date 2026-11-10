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

/**
 * Step 3 opened (refresh / back from payment): send back to step 2 only once the
 * selected saved child's face check has finished and found no usable face.
 */
export function shouldBounceToPhotoStep(args: {
  step: number;
  selectedChildId: string | null;
  savedFace: { id: string | null; has: boolean; loading: boolean };
  canProceed: boolean;
}): boolean {
  const { step, selectedChildId, savedFace, canProceed } = args;
  if (step !== 3 || canProceed) return false;
  const checkPending = savedFace.loading || (selectedChildId !== null && savedFace.id !== selectedChildId);
  return !checkPending;
}
