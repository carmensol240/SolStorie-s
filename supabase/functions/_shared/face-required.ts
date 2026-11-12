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

// From 12-11-2026 the child's looks come only from the avatar (+ the free text): no avatar = no story.
export const NO_AVATAR_MESSAGE = "כדי לאייר את הסיפור צריך אווטאר של הילד/ה. חזרו לשלב התמונה ונסו ליצור את האווטאר שוב. אם זה לא מצליח, כתבו לנו בוואטסאפ 053-5577007 ונעזור.";

/** True when the request or the saved child has the child's avatar (a real photo alone is not enough). */
export function hasAvatarSource(
  childAvatarUrl: unknown,
  savedChild: { avatar_url?: string | null } | null | undefined,
): boolean {
  return filled(childAvatarUrl) || filled(savedChild?.avatar_url);
}
