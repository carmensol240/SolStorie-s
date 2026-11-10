// Parent redraw limits: max per page and per story. Admins (is_effective_admin) and
// internal service calls are never limited and never recorded.
export const MAX_REDRAWS_PER_PAGE = 2;
export const MAX_REDRAWS_PER_STORY = 6;
export const REDRAW_LIMIT_MESSAGE_HE =
  "הגעת למספר הציורים מחדש בסיפור הזה. לעזרה, כתבו לנו בוואטסאפ 053-5577007";

export type RedrawCounts = { perPage: Record<number, number>; total: number };

/** Pure decision: would adding `pages` stay within the limits? */
export function redrawAllowed(counts: RedrawCounts, pages: number[]): boolean {
  if (pages.length === 0) return true;
  if (counts.total + pages.length > MAX_REDRAWS_PER_STORY) return false;
  const add: Record<number, number> = {};
  for (const p of pages) add[p] = (add[p] ?? 0) + 1;
  return Object.entries(add).every(([p, n]) => (counts.perPage[Number(p)] ?? 0) + n <= MAX_REDRAWS_PER_PAGE);
}

// deno-lint-ignore no-explicit-any
async function loadCounts(sb: any, storyId: string, excludeIds: string[] = []): Promise<RedrawCounts> {
  const { data, error } = await sb.from("illustration_redraws").select("id, page_number").eq("story_id", storyId);
  if (error) throw new Error(`redraw count failed: ${error.message}`);
  const perPage: Record<number, number> = {};
  let total = 0;
  for (const r of data ?? []) {
    if (excludeIds.includes(r.id)) continue;
    perPage[r.page_number] = (perPage[r.page_number] ?? 0) + 1;
    total++;
  }
  return { perPage, total };
}

/**
 * Reserve redraws for `pages` (insert first, then re-check, so two parallel clicks cannot both pass).
 * Returns the reserved row IDs, or null when the limit is reached (nothing is kept).
 */
// deno-lint-ignore no-explicit-any
export async function reserveRedraws(sb: any, storyId: string, userId: string, pages: number[], source: string): Promise<string[] | null> {
  if (pages.length === 0) return [];
  const before = await loadCounts(sb, storyId);
  if (!redrawAllowed(before, pages)) return null;
  const { data, error } = await sb.from("illustration_redraws")
    .insert(pages.map((p) => ({ story_id: storyId, page_number: p, user_id: userId, source })))
    .select("id");
  if (error) throw new Error(`redraw reserve failed: ${error.message}`);
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  const others = await loadCounts(sb, storyId, ids);
  if (!redrawAllowed(others, pages)) {
    await sb.from("illustration_redraws").delete().in("id", ids);
    return null;
  }
  return ids;
}

/** Give back reserved redraws when the drawing failed (the old picture stayed). */
// deno-lint-ignore no-explicit-any
export async function releaseRedraws(sb: any, ids: string[]): Promise<void> {
  if (!ids.length) return;
  await sb.from("illustration_redraws").delete().in("id", ids);
}
