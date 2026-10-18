// Supabase-backed taste unlock: charge one credit, open the story, and create
// the missing pictures with the same reference images and character description.
import { unlockTasteStory, type TasteUnlockStore, type UnlockResult } from "./taste.ts";

// deno-lint-ignore no-explicit-any
export function supabaseTasteUnlockStore(sb: any): TasteUnlockStore {
  return {
    async getStory(storyId) {
      const { data } = await sb.from("stories").select("id, user_id, is_taste").eq("id", storyId).maybeSingle();
      return data ?? null;
    },
    async getCredits(userId) {
      const { data } = await sb.from("profiles").select("story_credits").eq("id", userId).maybeSingle();
      return data?.story_credits ?? 0;
    },
    async casCredits(userId, from, to) {
      const { data, error } = await sb.from("profiles").update({ story_credits: to })
        .eq("id", userId).eq("story_credits", from).select("id");
      return !error && Array.isArray(data) && data.length > 0;
    },
    async markUnlocked(storyId) {
      const { data, error } = await sb.from("stories")
        .update({ is_taste: false, generation_status: "generating_illustrations" })
        .eq("id", storyId).eq("is_taste", true).select("id");
      return !error && Array.isArray(data) && data.length > 0;
    },
  };
}

/** Full unlock: ownership + taste check, charge, open, record unlock, start missing pictures. */
// deno-lint-ignore no-explicit-any
export async function unlockTasteAndComplete(sb: any, userId: string, storyId: string, amountPaid = 0): Promise<UnlockResult> {
  const result = await unlockTasteStory(supabaseTasteUnlockStore(sb), userId, storyId);
  if (result.kind !== "unlocked") {
    console.log("[taste] unlock skipped:", result.kind, storyId.substring(0, 8));
    return result;
  }
  const { error: uErr } = await sb.from("story_unlocks").insert({
    user_id: userId, story_id: storyId, unlock_type: "taste", amount_paid: amountPaid,
  });
  if (uErr && uErr.code !== "23505") console.error("[taste] story_unlocks insert failed:", uErr.message);
  await dispatchMissingIllustrations(sb, storyId);
  return result;
}

// deno-lint-ignore no-explicit-any
export async function dispatchMissingIllustrations(sb: any, storyId: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { data: story } = await sb.from("stories")
    .select("id, user_id, child_name, child_gender, age_range, child_photo_path, taste_resume")
    .eq("id", storyId).maybeSingle();
  if (!story) return;
  const { data: pages } = await sb.from("story_pages")
    .select("page_number, illustration_prompt, illustration_url")
    .eq("story_id", storyId).not("illustration_prompt", "is", null).is("illustration_url", null);
  const missing = (pages ?? []) as { page_number: number }[];
  if (missing.length === 0) {
    await sb.from("stories").update({ generation_status: "ready" }).eq("id", storyId);
    return;
  }
  const r = (story.taste_resume ?? {}) as Record<string, unknown>;
  const calls = missing.map((p) =>
    fetch(`${supabaseUrl}/functions/v1/generate-illustrations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId,
        childPhoto: story.child_photo_path ?? null,
        childAvatarUrl: r.childAvatarUrl ?? null,
        childGender: story.child_gender,
        ageRange: story.age_range,
        adventureLogic: r.adventureLogic ?? null,
        userId: story.user_id,
        childName: story.child_name,
        topic: r.topic ?? null,
        singlePageNumber: p.page_number,
        appearance: r.appearance ?? {},
        childAge: r.childAge ?? null,
      }),
    }).then((res) => res.text()).catch((e) => console.error("[taste] dispatch failed:", e)),
  );
  await Promise.race([Promise.allSettled(calls), new Promise((res) => setTimeout(res, 3000))]);
  console.log(`[taste] dispatched ${missing.length} missing pictures for ${storyId.substring(0, 8)}`);
}
