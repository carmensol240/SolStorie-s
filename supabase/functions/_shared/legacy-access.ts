// Safety net for stories made with credits before per-story unlock records existed.
// A story the user owns, that is not a free taste, created before the cutoff, is open
// even when its unlock record is missing. Shared by the story page and coloring server.
export const LEGACY_UNLOCK_CUTOFF = "2026-10-18T09:00:00Z";

export interface LegacyStoryInfo {
  user_id?: string | null;
  is_taste?: boolean | null;
  created_at?: string | null;
}

export function isLegacyOpenStory(story: LegacyStoryInfo | null | undefined, userId: string | null | undefined): boolean {
  if (!story || !userId || story.user_id !== userId) return false;
  if (story.is_taste) return false;
  if (!story.created_at) return false;
  return new Date(story.created_at).getTime() < new Date(LEGACY_UNLOCK_CUTOFF).getTime();
}

/** Retry a write a few times; returns true once it succeeds. */
export async function withRetry(fn: () => Promise<{ error: unknown } | void>, attempts = 3): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fn();
      if (!r || !(r as { error: unknown }).error) return true;
    } catch { /* retry */ }
    if (i < attempts - 1) await new Promise((res) => setTimeout(res, 200 * (i + 1)));
  }
  return false;
}
