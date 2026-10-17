/**
 * Tracks a story creation that is in progress, so a reload / tab switch /
 * re-login never loses it, never starts a second creation and never charges twice.
 * Stored in localStorage under the user-scoped prefix (cleared on sign-out).
 */

export const SESSION_TTL_MS = 15 * 60 * 1000;
const SUFFIX = "story_generation_in_progress";
const MAX_PHOTO_CHARS = 300_000; // larger inline photos are not kept (storage quota)

export interface GenerationSession<F = Record<string, unknown>> {
  requestId: string;
  startedAt: number;
  formData: F | null;
}

const keyFor = (userId: string) => `user_${userId}_${SUFFIX}`;

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function isSessionValid(s: GenerationSession | null | undefined, now = Date.now()): s is GenerationSession {
  return !!s && typeof s.requestId === "string" && typeof s.startedAt === "number" && now - s.startedAt >= 0 && now - s.startedAt < SESSION_TTL_MS;
}

export function startGenerationSession<F extends Record<string, unknown>>(userId: string, formData: F, now = Date.now()): GenerationSession<F> {
  const copy: Record<string, unknown> = { ...formData };
  const photo = copy.childPhoto;
  if (typeof photo === "string" && photo.length > MAX_PHOTO_CHARS) copy.childPhoto = null;
  const session: GenerationSession<F> = { requestId: newRequestId(), startedAt: now, formData: copy as F };
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(session));
  } catch {
    try { localStorage.setItem(keyFor(userId), JSON.stringify({ ...session, formData: null })); } catch { /* ignore */ }
  }
  return session;
}

export function getActiveGenerationSession<F = Record<string, unknown>>(userId: string | undefined | null, now = Date.now()): GenerationSession<F> | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const s = JSON.parse(raw) as GenerationSession<F>;
    if (isSessionValid(s as GenerationSession, now)) return s;
    localStorage.removeItem(keyFor(userId));
  } catch { /* ignore */ }
  return null;
}

export function clearGenerationSession(userId: string | undefined | null): void {
  if (userId) localStorage.removeItem(keyFor(userId));
  localStorage.removeItem("pending_story_formData"); // legacy key
}

/** True while any signed-in user on this device has a creation in progress. */
export function anyGenerationInProgress(now = Date.now()): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("user_") || !k.endsWith(SUFFIX)) continue;
      const s = JSON.parse(localStorage.getItem(k) || "null");
      if (isSessionValid(s, now)) return true;
    }
  } catch { /* ignore */ }
  return false;
}

/** Automatic page reloads (new version / service worker update) must wait while this is true. */
export function shouldDeferAutoReload(pathname: string, now = Date.now()): boolean {
  return pathname === "/create" || pathname.startsWith("/create/") || anyGenerationInProgress(now);
}

export type ArrivalDecision =
  | { kind: "form" }                       // no creation in progress → normal empty form
  | { kind: "ready"; storyId: string; slug: string | null }
  | { kind: "still_generating"; storyId: string }
  | { kind: "resume_generation" }          // request never saved on the server → re-send the SAME request ID
  | { kind: "restore_form" };              // nothing saved and no usable photo → refill the form

/** What to show when the story page opens with a valid in-progress mark. */
export function decideArrival(
  session: GenerationSession | null,
  story: { id: string; slug: string | null; generation_status: string | null } | null,
  now = Date.now(),
): ArrivalDecision {
  if (!isSessionValid(session, now)) return { kind: "form" };
  if (story) {
    if (story.generation_status === "generating") return { kind: "still_generating", storyId: story.id };
    if (story.generation_status === "failed") return { kind: "form" };
    return { kind: "ready", storyId: story.id, slug: story.slug };
  }
  const fd = session.formData as Record<string, unknown> | null;
  if (fd && typeof fd.childPhoto === "string" && fd.childPhoto) return { kind: "resume_generation" };
  return fd ? { kind: "restore_form" } : { kind: "form" };
}
