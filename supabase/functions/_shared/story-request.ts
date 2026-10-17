// One-time story request handling for generate-story.
// Order: save the story row with the client's request ID first (a unique index
// allows only one row per user + ID), and only if that succeeds take one credit.
// A repeated or parallel request with the same ID gets the existing story, no charge.

export interface StoryRequestStore {
  insertPlaceholder(row: Record<string, unknown>): Promise<{ id: string } | { conflict: true } | { error: string }>;
  findByRequest(userId: string, requestId: string): Promise<{ id: string; slug: string | null; generation_status: string | null } | null>;
  getCredits(userId: string): Promise<number>;
  casCredits(userId: string, from: number, to: number): Promise<boolean>;
  deleteStory(storyId: string): Promise<void>;
}

export type ClaimResult =
  | { kind: "claimed"; storyId: string }
  | { kind: "duplicate"; storyId: string; slug: string | null; status: string | null }
  | { kind: "no_credits" }
  | { kind: "error"; error: string };

export function isValidRequestId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v);
}

export async function claimStoryRequest(
  store: StoryRequestStore,
  userId: string,
  requestId: string,
  row: Record<string, unknown>,
): Promise<ClaimResult> {
  const ins = await store.insertPlaceholder({
    ...row,
    user_id: userId,
    client_request_id: requestId,
    generation_status: "generating",
  });
  if ("conflict" in ins) {
    const existing = await store.findByRequest(userId, requestId);
    if (!existing) return { kind: "error", error: "duplicate_not_found" };
    return { kind: "duplicate", storyId: existing.id, slug: existing.slug, status: existing.generation_status };
  }
  if ("error" in ins) return { kind: "error", error: ins.error };

  for (let attempt = 0; attempt < 5; attempt++) {
    const credits = await store.getCredits(userId);
    if (credits <= 0) {
      await store.deleteStory(ins.id);
      return { kind: "no_credits" };
    }
    if (await store.casCredits(userId, credits, credits - 1)) {
      return { kind: "claimed", storyId: ins.id };
    }
  }
  await store.deleteStory(ins.id);
  return { kind: "error", error: "credit_cas_failed" };
}

/** Undo a claimed request after a failure: remove the unfinished story and give the credit back. */
export async function releaseStoryRequest(store: StoryRequestStore, userId: string, storyId: string): Promise<void> {
  await store.deleteStory(storyId);
  for (let attempt = 0; attempt < 5; attempt++) {
    const credits = await store.getCredits(userId);
    if (await store.casCredits(userId, credits, credits + 1)) return;
  }
  console.error("[story-request] refund failed for user", userId.substring(0, 8));
}

// deno-lint-ignore no-explicit-any
export function supabaseStoryRequestStore(sb: any): StoryRequestStore {
  return {
    async insertPlaceholder(row) {
      const { data, error } = await sb.from("stories").insert(row).select("id").single();
      if (error) return error.code === "23505" ? { conflict: true } : { error: error.message };
      return { id: data.id };
    },
    async findByRequest(userId, requestId) {
      const { data } = await sb
        .from("stories")
        .select("id, slug, generation_status")
        .eq("user_id", userId)
        .eq("client_request_id", requestId)
        .maybeSingle();
      return data ?? null;
    },
    async getCredits(userId) {
      const { data } = await sb.from("profiles").select("story_credits").eq("id", userId).maybeSingle();
      return data?.story_credits ?? 0;
    },
    async casCredits(userId, from, to) {
      const { data, error } = await sb
        .from("profiles")
        .update({ story_credits: to })
        .eq("id", userId)
        .eq("story_credits", from)
        .select("id");
      return !error && Array.isArray(data) && data.length > 0;
    },
    async deleteStory(storyId) {
      await sb.from("story_pages").delete().eq("story_id", storyId);
      await sb.from("stories").delete().eq("id", storyId);
    },
  };
}
