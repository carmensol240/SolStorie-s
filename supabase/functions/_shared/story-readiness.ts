import { pagesWithLookIssue } from "./look-check.ts";
// When is a story "ready"? Every needed page has a picture.
// A page that was tried and ended without a picture (held for admin or all services failed)
// makes the story "needs_attention" instead of ready; untried pages mean "waiting".
export type StoryReadiness = "ready" | "needs_attention" | "waiting";

export function decideStoryReadiness(
  neededPages: number[],
  withPicture: Set<number>,
  triedWithoutPicture: Set<number>,
  textIssues: unknown = null,
  lookIssues: Set<number> = new Set(),
): StoryReadiness {
  const missing = neededPages.filter((p) => !withPicture.has(p));
  // Text that failed the final check (stories.text_issues) never counts as finished,
  // nor does a picture kept although it differs from page 1 (look-check.ts).
  if (missing.length === 0) {
    const look = neededPages.some((p) => lookIssues.has(p));
    return hasTextIssues(textIssues) || look ? "needs_attention" : "ready";
  }
  if (missing.every((p) => triedWithoutPicture.has(p))) return "needs_attention";
  return "waiting";
}

/** stories.text_issues holds at least one failing page. */
export function hasTextIssues(textIssues: unknown): boolean {
  if (!textIssues || typeof textIssues !== "object") return false;
  const pages = (textIssues as any).pages ?? textIssues;
  return !!pages && typeof pages === "object" && Object.keys(pages).length > 0;
}

// Log names of a page attempt that ended with no picture.
export const NO_PICTURE_MODELS = ["held_refused", "held_mismatch", "none_failed"];

/**
 * Re-check one story and update its status.
 * onlyIfNeedsAttention: used after a single redraw, so a story still being drawn is never touched.
 */
export async function refreshStoryReadiness(
  supabase: any,
  storyId: string,
  opts: { onlyIfNeedsAttention?: boolean } = {},
): Promise<StoryReadiness | null> {
  const { data: story } = await supabase.from("stories")
    .select("generation_status, is_taste, taste_page_limit, text_issues").eq("id", storyId).maybeSingle();
  if (!story) return null;
  if (opts.onlyIfNeedsAttention && story.generation_status !== "needs_attention") return null;

  const { data: pages } = await supabase.from("story_pages")
    .select("page_number, illustration_url").eq("story_id", storyId).not("illustration_prompt", "is", null);
  const needed = (pages ?? []).filter((p: any) => !story.is_taste || p.page_number <= (story.taste_page_limit ?? 0));
  const neededNums = needed.map((p: any) => p.page_number as number);
  const withPic = new Set<number>(needed.filter((p: any) => p.illustration_url).map((p: any) => p.page_number as number));
  const missing = neededNums.filter((n: number) => !withPic.has(n));
  let tried = new Set<number>();
  if (missing.length) {
    const { data: logs } = await supabase.from("illustration_logs").select("page_number")
      .eq("story_id", storyId).in("model_used", NO_PICTURE_MODELS).in("page_number", missing);
    tried = new Set((logs ?? []).map((l: any) => l.page_number as number));
  }
  const { data: lookLogs } = await supabase.from("illustration_logs")
    .select("page_number, identity_check, created_at").eq("story_id", storyId).not("identity_check", "is", null);
  const lookIssues = pagesWithLookIssue(lookLogs ?? []);
  const decision = decideStoryReadiness(neededNums, withPic, tried, story.text_issues, lookIssues);
  if (decision !== "waiting" && story.generation_status !== decision) {
    const { error } = await supabase.from("stories").update({ generation_status: decision }).eq("id", storyId);
    if (error) console.error("[story-readiness] status update failed:", error.message);
  }
  return decision;
}
