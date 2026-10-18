import { TASTE_UNLOCK_PACKAGES } from "./taste.ts";
import { unlockTasteAndComplete } from "./taste-server.ts";
import { creditKindForPackage } from "./catalog.ts";
import { consumeCredit, grantStoryAccess } from "./story-access.ts";
// Shared purchase credit logic used by verify-purchase and grow-webhook.
// Story credits remember their package: "full" credits are tracked as lots
// (story_credit_lots); every other story credit counts as digital.

export const packageConfig: Record<string, any> = {
  // Current packages (prices in catalog.ts)
  single_story: { stories: 1, freeEdits: 1 },
  popular: { stories: 1, freeEdits: 1 },
  pdf: { stories: 0, freeEdits: 0, pdfForStory: true },
  // Retired packages — still honored for payments already made / old links
  basic: { stories: 1, freeEdits: 1 },
  single_story_digital: { stories: 1, freeEdits: 1 },
  single_story_full: { stories: 1, freeEdits: 1 },
  gift_two_stories: { stories: 2, freeEdits: 2 },
  coloring_single: { stories: 0, freeEdits: 0, coloringPages: 1 },
  coloring_bundle: { stories: 0, freeEdits: 0, coloringPages: 5 },
  coloring_story: { stories: 0, freeEdits: 0, coloringPages: 5 },
};
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ApplyCreditsParams {
  supabase: any;
  userId: string;
  packageId: string;
  amount: number;
  orderId: string;
  source: "grow" | "test";
  storyId?: string | null;
  couponCode?: string | null;
  status?: string;
}

export interface ApplyCreditsResult {
  success: boolean;
  duplicate?: boolean;
  error?: string;
  status?: number;
  updates?: Record<string, any>;
  profile?: any;
}

export async function applyPurchaseCredits(
  params: ApplyCreditsParams
): Promise<ApplyCreditsResult> {
  const { supabase, userId, packageId, amount, orderId, source, storyId, couponCode } = params;

  // Idempotency check by source + orderId prefix
  const { data: existingPurchase } = await supabase
    .from("purchases")
    .select("id, package_name")
    .like("package_name", `${source}_${orderId}_%`)
    .maybeSingle();
  if (existingPurchase) {
    console.log(`[PURCHASE-CREDITS] Duplicate ${source} order, already processed:`, orderId);
    return { success: true, duplicate: true };
  }

  const config = packageConfig[packageId];
  if (!config) {
    console.error("[PURCHASE-CREDITS] Unknown package:", packageId);
    return { success: false, error: "Unknown package", status: 400 };
  }
  const creditKind = creditKindForPackage(packageId);

  // The story attached from a lock screen (cField3), if any.
  let story: { id: string; user_id: string | null; is_taste: boolean } | null = null;
  if (storyId) {
    const col = UUID_REGEX.test(storyId) ? "id" : "slug";
    const { data } = await supabase.from("stories").select("id, user_id, is_taste").eq(col, storyId).maybeSingle();
    story = data ?? null;
  }
  const ownStory = story && story.user_id === userId ? story : null;

  const packageName = couponCode ? `${packageId}_coupon_${couponCode}` : packageId;
  const status = params.status ?? (source === "test" ? "test_completed" : "completed");
  const { error: purchaseError } = await supabase.from("purchases").insert({
    user_id: userId,
    package_name: `${source}_${orderId}_${packageName}`,
    credits_purchased: config.stories || 0,
    amount_ils: source === "test" ? 0 : amount,
    status,
  });
  if (purchaseError) {
    console.error("[PURCHASE-CREDITS] Failed to insert purchase:", purchaseError);
    return { success: false, error: "Failed to record purchase", status: 500 };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("story_credits, free_edits_remaining, free_edits_total, coloring_credits, editing_credits, is_subscriber")
    .eq("id", userId)
    .maybeSingle();
  if (profileError || !profile) {
    console.error("[PURCHASE-CREDITS] Failed to get profile:", profileError);
    return { success: false, error: "Failed to get user profile", status: 500 };
  }

  const updates: Record<string, any> = {};
  if (config.stories > 0) updates.story_credits = (profile.story_credits ?? 0) + config.stories;
  if (config.freeEdits > 0) {
    updates.free_edits_remaining = (profile.free_edits_remaining ?? 0) + config.freeEdits;
    updates.free_edits_total = (profile.free_edits_total ?? 0) + config.freeEdits;
  }
  if (config.coloringPages > 0) updates.coloring_credits = (profile.coloring_credits ?? 0) + config.coloringPages;
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (updateError) {
      console.error("[PURCHASE-CREDITS] Failed to update profile:", updateError);
      return { success: false, error: "Failed to update credits", status: 500 };
    }
  }
  // Full-story credits remember that they are full.
  if (creditKind === "full" && config.stories > 0) {
    const { error: lotErr } = await supabase.from("story_credit_lots").insert({
      user_id: userId, kind: "full", remaining: config.stories, source, order_id: `${source}_${orderId}`,
    });
    if (lotErr && lotErr.code !== "23505") console.error("[PURCHASE-CREDITS] full lot failed:", lotErr);
  }

  // Print file add-on: only for the buyer's own story. Never a general permission.
  if (config.pdfForStory) {
    if (ownStory) {
      const { error: pdfError } = await supabase.from("pdf_entitlements").insert({
        user_id: userId, story_id: ownStory.id, source, amount_paid: amount,
      });
      if (pdfError && pdfError.code !== "23505") console.error("[PURCHASE-CREDITS] pdf entitlement failed:", pdfError);
    } else {
      await supabase.from("admin_alerts").insert({
        user_id: userId, alert_type: "pdf_without_story",
        message: `Print file paid (${amount}₪, order ${orderId}) without the buyer's story attached — attach manually.`,
      });
    }
  }

  // Bought from a lock screen of the buyer's own story: use the new credit on it.
  if (ownStory && creditKind && TASTE_UNLOCK_PACKAGES.has(packageId)) {
    if (ownStory.is_taste) {
      try {
        const r = await unlockTasteAndComplete(supabase, userId, ownStory.id, creditKind);
        console.log("[PURCHASE-CREDITS] taste unlock:", r.kind);
      } catch (e) {
        console.error("[PURCHASE-CREDITS] taste unlock failed:", e);
      }
    } else {
      const { data: unlocked } = await supabase.from("story_unlocks").select("id")
        .eq("user_id", userId).eq("story_id", ownStory.id).maybeSingle();
      if (!unlocked && (await consumeCredit(supabase, userId, creditKind))) {
        await grantStoryAccess(supabase, userId, ownStory.id, creditKind, "single");
      }
    }
  }

  console.log("[PURCHASE-CREDITS] ✅ Credits applied:", { orderId, packageId, creditKind, userId, updates, source });
  return { success: true, updates, profile };
}

// Amount → packageId fallback, used ONLY when cField2 is missing from the
// Grow webhook. Current amounts come from the catalog; each amount is one package.
import { CATALOG } from "./catalog.ts";
export function packageIdFromAmount(amount: number): string | null {
  const a = Math.round(amount * 100) / 100;
  for (const p of Object.values(CATALOG)) if (Math.abs(p.price - a) < 0.001) return p.packageId;
  return null;
}
