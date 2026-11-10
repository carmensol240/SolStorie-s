// A story is only created when we have a face to draw the child from.
export const NO_FACE_MESSAGE = "צריך להעלות תמונה של הילד כדי שנוכל לאייר אותו בסיפור";

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

export function hasFaceSource(
  childPhoto: unknown,
  childAvatarUrl: unknown,
  savedChild: { avatar_url?: string | null; photo_url?: string | null } | null | undefined,
): boolean {
  return filled(childPhoto) || filled(childAvatarUrl) || filled(savedChild?.avatar_url) || filled(savedChild?.photo_url);
}
