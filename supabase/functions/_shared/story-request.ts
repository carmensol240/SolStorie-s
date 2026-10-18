import { spendCredit, type CreditKind } from "./taste.ts";
import { consumeCredit, refundCredit } from "./story-access.ts";
// One-time story request handling for generate-story.
// Order: save the story row with the client's request ID first (a unique index
// allows only one row per user + ID), and only if that succeeds take one credit.
// A repeated or parallel request with the same ID gets the existing story, no charge.

export interface StoryRequestStore {
  insertPlaceholder(row: Record<string, unknown>): Promise<{ id: string } | { conflict: true } | { error: string }>;
  findByRequest(userId: string, requestId: string): Promise<{ id: string; slug: string | null; generation_status: string | null } | null>;
  /** Take one credit of this kind; returns the kind taken or null. */
  consume(userId: string, kind: CreditKind): Promise<CreditKind | null>;
  refund(userId: string, kind: CreditKind): Promise<void>;
  deleteStory(storyId: string): Promise<void>;
}

export type ClaimResult =
  | { kind: "claimed"; storyId: string; creditKind: CreditKind }
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
  creditKind?: CreditKind | null,
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

  const spent = await spendCredit((k) => store.consume(userId, k), creditKind);
  if (!spent) {
    await store.deleteStory(ins.id);
    return { kind: "no_credits" };
  }
  return { kind: "claimed", storyId: ins.id, creditKind: spent };
}

export interface TasteClaimStore {
  /** Insert the one-time taste claim. Returns false when a unique rule (user/email/device) already has one. */
  insertClaim(claim: Record<string, unknown>): Promise<boolean>;
  deleteClaimForStory(storyId: string): Promise<void>;
}

export type TasteClaimResult =
  | { kind: "claimed"; storyId: string }
  | { kind: "duplicate"; storyId: string; slug: string | null; status: string | null }
  | { kind: "not_eligible" }
  | { kind: "error"; error: string };

/** Free taste: save the row first (same one-time ID rule), then take the one-time claim. No credit is charged. */
export async function claimTasteRequest(
  store: StoryRequestStore,
  claims: TasteClaimStore,
  userId: string,
  requestId: string,
  row: Record<string, unknown>,
  claim: Record<string, unknown>,
): Promise<TasteClaimResult> {
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
  const ok = await claims.insertClaim({ ...claim, user_id: userId, story_id: ins.id });
  if (!ok) {
    await store.deleteStory(ins.id);
    return { kind: "not_eligible" };
  }
  return { kind: "claimed", storyId: ins.id };
}

/** Undo an unfinished taste: remove the story and its claim so the user can try again. No refund (nothing was charged). */
export async function releaseTasteRequest(store: StoryRequestStore, claims: TasteClaimStore, storyId: string): Promise<void> {
  await store.deleteStory(storyId);
  await claims.deleteClaimForStory(storyId);
}

// deno-lint-ignore no-explicit-any
export function supabaseTasteClaimStore(sb: any): TasteClaimStore {
  return {
    async insertClaim(claim) {
      const { error } = await sb.from("free_taste_claims").insert(claim);
      if (error && error.code !== "23505") console.error("[taste] claim insert error:", error.message);
      return !error;
    },
    async deleteClaimForStory(storyId) {
      await sb.from("free_taste_claims").delete().eq("story_id", storyId);
    },
  };
}

/** Undo a claimed request after a failure: remove the unfinished story and give the same kind of credit back. */
export async function releaseStoryRequest(store: StoryRequestStore, userId: string, storyId: string, kind: CreditKind = "digital"): Promise<void> {
  await store.deleteStory(storyId);
  await store.refund(userId, kind);
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
    consume: (userId, kind) => consumeCredit(sb, userId, kind),
    refund: (userId, kind) => refundCredit(sb, userId, kind),
    async deleteStory(storyId) {
      await sb.from("story_unlocks").delete().eq("story_id", storyId);
      await sb.from("pdf_entitlements").delete().eq("story_id", storyId);
      await sb.from("story_pages").delete().eq("story_id", storyId);
      await sb.from("stories").delete().eq("id", storyId);
    },
  };
}
