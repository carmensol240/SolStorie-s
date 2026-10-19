/** Step 2 rule: the child photo is optional; consent is needed only if a photo was added. */
export function canProceedWithPhoto(photo: string | null | undefined, consent: boolean): boolean {
  const hasPhoto = typeof photo === "string" && photo.trim().length > 0;
  return !hasPhoto || consent;
}
