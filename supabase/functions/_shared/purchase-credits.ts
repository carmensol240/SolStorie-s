// Shared purchase credit logic used by verify-purchase and grow-webhook
import { isPromoActive } from "./promo.ts";

export const packageConfig: Record<string, any> = {
  basic: { stories: 2, freeEdits: 2, coloringPages: 2 },
  popular: { stories: 1, freeEdits: 1, coloringPages: 0, pdfDownload: true, dynamicColoringFromStory: true },
  coloring_single: { stories: 0, freeEdits: 0, coloringPages: 1 },
  coloring_bundle: { stories: 0, freeEdits: 0, coloringPages: 0, dynamicColoringFromStory: true },
  coloring_story: { stories: 0, freeEdits: 0, coloringPages: 0, dynamicColoringFromStory: true },
  single_story: { stories: 1, freeEdits: 1, coloringPages: 0 },
  single_story_digital: { stories: 1, freeEdits: 1, coloringPages: 1 },
  single_story_full: { stories: 1, freeEdits: 1, coloringPages: 1 },
  pdf: { stories: 0, freeEdits: 0, coloringPages: 0, pdfDownload: true },
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

  const config = { ...(packageConfig[packageId] || {}) };
  if (!packageConfig[packageId]) {
    console.error("[PURCHASE-CREDITS] Unknown package:", packageId);
    return { success: false, error: "Unknown package", status: 400 };
  }

  // Dynamic coloring credits — count illustrations in the story
  if (config.dynamicColoringFromStory) {
    let resolvedStoryUuid: string | null = null;
    if (storyId) {
      if (UUID_REGEX.test(storyId)) {
        resolvedStoryUuid = storyId;
      } else {
        const { data: storyRow } = await supabase
          .from("stories")
          .select("id")
          .eq("slug", storyId)
          .maybeSingle();
        resolvedStoryUuid = storyRow?.id ?? null;
      }
    }
    if (resolvedStoryUuid) {
      const { count } = await supabase
        .from("story_pages")
        .select("id", { count: "exact", head: true })
        .eq("story_id", resolvedStoryUuid)
        .not("illustration_url", "is", null);
      config.coloringPages = Math.max(1, count ?? 1);
    } else {
      config.coloringPages = 5;
    }
    console.log("[PURCHASE-CREDITS] coloring_story → credits:", config.coloringPages);
  }

  // First-purchase bonus — applies ONLY to single_story package.
  // First-purchase 1+1 bonus — applies to ANY package on the user's very first
  // successful purchase. Grants +1 of the primary product type that was
  // purchased: +1 story credit if the package includes stories, otherwise
  // +1 coloring credit if the package includes coloring pages. Skips packages
  // that don't grant either (e.g. standalone pdf).
  //
  // We use an atomic conditional UPDATE at the end (WHERE first_purchase_bonus_given = false)
  // to guarantee the bonus flag is set only once even under concurrent webhooks.
  let firstPurchaseBonusGranted = false;
  let firstPurchaseBonusType: "story" | "coloring" | null = null;
  if (isPromoActive()) {
    const { data: bonusProfile } = await supabase
      .from("profiles")
      .select("first_purchase_bonus_given")
      .eq("id", userId)
      .maybeSingle();
    const { count: priorCount } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["completed", "test_completed"]);
    const alreadyGranted = !!bonusProfile?.first_purchase_bonus_given;
    if (!alreadyGranted && (priorCount ?? 0) === 0) {
      if ((config.stories ?? 0) > 0) {
        config.stories = (config.stories ?? 0) + 1;
        config.freeEdits = (config.freeEdits ?? 0) + 1;
        firstPurchaseBonusType = "story";
        firstPurchaseBonusGranted = true;
        console.log("[PURCHASE-CREDITS] first-purchase 1+1 bonus applied → +1 story, +1 edit");
      } else if ((config.coloringPages ?? 0) > 0 || config.dynamicColoringFromStory) {
        config.coloringPages = (config.coloringPages ?? 0) + 1;
        firstPurchaseBonusType = "coloring";
        firstPurchaseBonusGranted = true;
        console.log("[PURCHASE-CREDITS] first-purchase 1+1 bonus applied → +1 coloring page");
      } else {
        console.log("[PURCHASE-CREDITS] first-purchase bonus skipped — package has no story or coloring product");
      }
    } else {
      console.log("[PURCHASE-CREDITS] first-purchase bonus SKIPPED (already granted or prior purchase exists)", { alreadyGranted, priorCount });
    }
  }

  // Insert purchase record
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

  // Get current profile
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
  if (config.stories > 0) {
    updates.story_credits = (profile.story_credits ?? 0) + config.stories;
  }
  if (config.freeEdits > 0) {
    updates.free_edits_remaining = (profile.free_edits_remaining ?? 0) + config.freeEdits;
    updates.free_edits_total = (profile.free_edits_total ?? 0) + config.freeEdits;
  }
  if (config.coloringPages > 0) {
    updates.coloring_credits = (profile.coloring_credits ?? 0) + config.coloringPages;
  }
  if (config.editingCredits > 0) {
    updates.editing_credits = (profile.editing_credits ?? 0) + config.editingCredits;
  }
  if (config.isSubscription) {
    updates.is_subscriber = true;
  }
  if (Object.keys(updates).length > 0) {
    if (firstPurchaseBonusGranted) {
      // Atomic: only set the flag (and its extra +1 embedded in updates) if the
      // flag wasn't already set by a concurrent webhook. If the guarded update
      // affects 0 rows, back the bonus out and retry without it.
      updates.first_purchase_bonus_given = true;
      const { data: updatedRows, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .eq("first_purchase_bonus_given", false)
        .select("id");
      if (updateError) {
        console.error("[PURCHASE-CREDITS] Failed to update profile (guarded):", updateError);
        return { success: false, error: "Failed to update credits", status: 500 };
      }
      if (!updatedRows || updatedRows.length === 0) {
        // Another concurrent purchase already claimed the bonus. Re-apply the
        // purchase credits WITHOUT the +1 bonus.
        console.log("[PURCHASE-CREDITS] Bonus race lost — reapplying without bonus");
        const retryUpdates: Record<string, any> = {};
        const baseStories = (packageConfig[packageId].stories ?? 0);
        const baseColoring = (packageConfig[packageId].coloringPages ?? 0);
        if (baseStories > 0) {
          retryUpdates.story_credits = (profile.story_credits ?? 0) + baseStories;
          retryUpdates.free_edits_remaining = (profile.free_edits_remaining ?? 0) + (packageConfig[packageId].freeEdits ?? 0);
          retryUpdates.free_edits_total = (profile.free_edits_total ?? 0) + (packageConfig[packageId].freeEdits ?? 0);
        }
        // Recompute dynamic coloring value already stored in config.coloringPages
        // minus the +1 bonus, if the bonus was of type coloring.
        const finalColoring = firstPurchaseBonusType === "coloring"
          ? Math.max(0, (config.coloringPages ?? 0) - 1)
          : (config.coloringPages ?? 0);
        if (finalColoring > 0) {
          retryUpdates.coloring_credits = (profile.coloring_credits ?? 0) + finalColoring;
        }
        if (config.editingCredits > 0) {
          retryUpdates.editing_credits = (profile.editing_credits ?? 0) + config.editingCredits;
        }
        if (config.isSubscription) {
          retryUpdates.is_subscriber = true;
        }
        if (Object.keys(retryUpdates).length > 0) {
          const { error: retryErr } = await supabase
            .from("profiles")
            .update(retryUpdates)
            .eq("id", userId);
          if (retryErr) {
            console.error("[PURCHASE-CREDITS] Retry update failed:", retryErr);
            return { success: false, error: "Failed to update credits", status: 500 };
          }
        }
      }
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);
      if (updateError) {
        console.error("[PURCHASE-CREDITS] Failed to update profile:", updateError);
        return { success: false, error: "Failed to update credits", status: 500 };
      }
    }
  }

  // PDF entitlement — grants the user permission to download the printable
  // PDF for the specified story (or globally when no storyId is attached).
  if (config.pdfDownload) {
    let pdfStoryUuid: string | null = null;
    if (storyId) {
      if (UUID_REGEX.test(storyId)) {
        pdfStoryUuid = storyId;
      } else {
        const { data: storyRow } = await supabase
          .from("stories")
          .select("id")
          .eq("slug", storyId)
          .maybeSingle();
        pdfStoryUuid = storyRow?.id ?? null;
      }
    }
    const { error: pdfError } = await supabase.from("pdf_entitlements").insert({
      user_id: userId,
      story_id: pdfStoryUuid,
      source,
      amount_paid: amount,
    });
    if (pdfError && (pdfError as any).code !== "23505") {
      console.error("[PURCHASE-CREDITS] Failed to insert pdf entitlement:", pdfError);
      // Do not fail the whole purchase — purchase row is already recorded.
    } else if (!pdfError) {
      console.log("[PURCHASE-CREDITS] ✅ PDF entitlement granted:", { userId, pdfStoryUuid });
    }
  }

  // Insert story unlock for single-story purchases (any package that grants
  // access to one specific story when a storyId is passed in cField3).
  const SINGLE_STORY_PACKAGES = new Set([
    "single_story",
    "single_story_digital",
    "single_story_full",
    "basic",
  ]);
  if (storyId && SINGLE_STORY_PACKAGES.has(packageId)) {
    let resolvedStoryId: string | null = null;
    if (UUID_REGEX.test(storyId)) {
      resolvedStoryId = storyId;
    } else {
      const { data: storyRow, error: storyErr } = await supabase
        .from("stories")
        .select("id")
        .eq("slug", storyId)
        .maybeSingle();
      if (storyErr || !storyRow) {
        console.error("[PURCHASE-CREDITS] Failed to resolve story slug, skipping unlock:", storyId, storyErr);
        resolvedStoryId = null;
      }
      if (storyRow) resolvedStoryId = storyRow.id;
    }

    if (resolvedStoryId) {
      const { error: unlockError } = await supabase.from("story_unlocks").insert({
        user_id: userId,
        story_id: resolvedStoryId,
        unlock_type: "single",
        amount_paid: amount,
      });
      if (unlockError) {
        if ((unlockError as any).code === "23505") {
          console.log("[PURCHASE-CREDITS] Story already unlocked, continuing");
        } else {
          console.error("[PURCHASE-CREDITS] Failed to insert story unlock:", unlockError);
          // Do not fail the whole purchase — credits already applied.
        }
      } else {
        console.log("[PURCHASE-CREDITS] ✅ Story unlocked:", resolvedStoryId);
      }
    }
  }

  console.log("[PURCHASE-CREDITS] ✅ Credits applied:", { orderId, packageId, userId, updates, source });
  return { success: true, updates, profile };
}

// Amount → packageId fallback mapping. Used ONLY when cField2 is missing from
// the Grow webhook payload. Keep this in sync with actual Grow dashboard prices.
//
// Current Grow prices (promo, until 31/8/26):
//   basic (single_story_digital)       29.90
//   popular                             99.90
//   single_story (DemoLockModal)        39.90
//   coloring_single                      9.90
//   coloring_bundle                     24.90
//   pdf                                 59.90  ⚠ collides with gift_two_stories 59.90
//   gift_two_stories                    59.90  ⚠ collides with pdf 59.90
//
// Regular prices (from 1/9/26): basic 39.90, popular 119.90, pdf 69.90,
// gift_two_stories 69.90 (also collides). Legacy amounts kept for
// backwards-compat with older Grow links that may still be live.
//
// COLLISIONS: 59.90 and 69.90 map to BOTH pdf and gift_two_stories. This
// fallback prefers `pdf` (higher-volume flow); gift purchases MUST arrive with
// cField2="gift_two_stories" or they'll be miscategorised. `openGrowCheckout`
// always sets cField2, so this only affects direct Grow-link clicks bypassing
// our checkout wrapper.
export function packageIdFromAmount(amount: number): string | null {
  const a = Math.round(amount * 100) / 100;
  // single_story_digital (basic) — 29.90 promo, 39.90 regular, 49.90 legacy
  if (a === 29.9) return "single_story_digital";
  if (a === 39.9) return "single_story_digital";
  if (a === 49.9) return "single_story_digital";
  // popular — 99.90 promo, 119.90 regular, 129.90 legacy
  if (a === 99.9) return "popular";
  if (a === 119.9) return "popular";
  if (a === 129.9) return "popular";
  // coloring
  if (a === 9.9) return "coloring_single";
  if (a === 24.9) return "coloring_bundle";
  // AMBIGUOUS: 59.90 and 69.90 are used by BOTH `pdf` and `gift_two_stories`.
  // We intentionally return null instead of guessing — the webhook logs an
  // `unknown_package` alert and no credits are issued to the wrong product.
  // `openGrowCheckout` always sends cField2, so real user flows are unaffected;
  // only direct paylink clicks that bypass our wrapper (or a misconfigured
  // Grow link) will hit this branch.
  if (a === 59.9) return null;
  if (a === 69.9) return null;
  // gift_two_stories legacy standalone amount (89.90 before 12/7/26 relaunch)
  if (a === 89.9) return "gift_two_stories";
  return null;
}