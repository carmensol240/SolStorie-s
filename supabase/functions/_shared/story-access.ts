// Credits by kind + what a story gets when a credit is used on it.
// Digital credit -> story open (incl. all its coloring pages).
// Full credit    -> the same + the print file for THIS story.
import type { CreditKind } from "./taste.ts";
import { withRetry } from "./legacy-access.ts";

// deno-lint-ignore no-explicit-any
export async function consumeCredit(sb: any, userId: string, kind: CreditKind): Promise<CreditKind | null> {
  const { data, error } = await sb.rpc("consume_story_credit", { p_user_id: userId, p_kind: kind });
  if (error) { console.error("[credits] consume failed:", error.message); return null; }
  return data === "full" || data === "digital" ? data : null;
}

// deno-lint-ignore no-explicit-any
export async function refundCredit(sb: any, userId: string, kind: CreditKind): Promise<void> {
  const { error } = await sb.rpc("refund_story_credit", { p_user_id: userId, p_kind: kind });
  if (error) console.error("[credits] refund failed:", error.message);
}

/** Record that this story was bought with a credit of `kind` (and give the print file for full). */
// deno-lint-ignore no-explicit-any
export async function grantStoryAccess(sb: any, userId: string, storyId: string, kind: CreditKind, unlockType?: string): Promise<boolean> {
  const ok = await withRetry(() => sb.from("story_unlocks").upsert(
    { user_id: userId, story_id: storyId, unlock_type: unlockType ?? `credit_${kind}`, amount_paid: 0 },
    { onConflict: "user_id,story_id", ignoreDuplicates: true },
  ));
  if (!ok) {
    console.error("[access] story_unlocks failed after retries", storyId);
    try {
      await sb.from("admin_alerts").insert({
        user_id: userId, alert_type: "unlock_missing",
        message: `Story ${storyId} was paid with a ${kind} credit but its unlock record could not be saved`,
      });
    } catch { /* ignore */ }
  }
  if (kind === "full") {
    const { error: pErr } = await sb.from("pdf_entitlements").insert({
      user_id: userId, story_id: storyId, source: "full_story_credit", amount_paid: 0,
    });
    if (pErr && pErr.code !== "23505") console.error("[access] pdf_entitlements failed:", pErr.message);
  }
  return ok;
}

/** Undo grantStoryAccess (failed creation). */
// deno-lint-ignore no-explicit-any
export async function revokeStoryAccess(sb: any, storyId: string) {
  await sb.from("story_unlocks").delete().eq("story_id", storyId);
  await sb.from("pdf_entitlements").delete().eq("story_id", storyId);
}
