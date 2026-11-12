/**
 * Step 2 rule: the child's avatar is required (looks come only from the avatar + the free text).
 * - a new photo + consent + its avatar made from it, or
 * - a saved child profile that already has avatar_url.
 * A photo without an avatar is not enough.
 */
export function canProceedWithPhoto(
  photo: string | null | undefined,
  consent: boolean,
  savedProfileHasAvatar = false,
  avatar?: string | null,
): boolean {
  if (savedProfileHasAvatar) return true;
  const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  return filled(photo) && consent && filled(avatar);
}

/** WhatsApp help when the avatar cannot be made. */
export const AVATAR_HELP_WHATSAPP = "https://wa.me/972535577007";
export const AVATAR_FAILED_MESSAGE = "לא הצלחנו ליצור את האווטאר, ובלעדיו אי אפשר ליצור סיפור. נסו שוב, או כתבו לנו בוואטסאפ 053-5577007 ונעזור.";

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
