// Shared purchase credit logic used by verify-purchase and grow-webhook

export const packageConfig: Record<string, any> = {
  basic: { stories: 2, freeEdits: 2, coloringPages: 2 },
  popular: { stories: 6, freeEdits: 6, coloringPages: 6 },
  premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
  educator_basic: { stories: 2, freeEdits: 2, coloringPages: 2 },
  educator_popular: { stories: 6, freeEdits: 6, coloringPages: 6 },
  educator_premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
  coloring_kit: { stories: 0, freeEdits: 0, coloringPages: 5 },
  coloring_single: { stories: 0, freeEdits: 0, coloringPages: 1 },
  coloring_bundle: { stories: 0, freeEdits: 0, coloringPages: 5 },
  coloring_story: { stories: 0, freeEdits: 0, coloringPages: 0, dynamicColoringFromStory: true },
  edit_kit: { stories: 0, freeEdits: 0, coloringPages: 0, editingCredits: 5 },
  toolkit_yearly: { stories: 0, freeEdits: 0, coloringPages: 0, isSubscription: true },
  single_story: { stories: 0, freeEdits: 0, coloringPages: 0 },
  single_story_digital: { stories: 1, freeEdits: 1, coloringPages: 0 },
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
  source: "paypal" | "grow" | "test";
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
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (updateError) {
      console.error("[PURCHASE-CREDITS] Failed to update profile:", updateError);
      return { success: false, error: "Failed to update credits", status: 500 };
    }
  }

  // Insert story unlock for single-story purchases
  if (packageId === "single_story" && storyId) {
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
        console.error("[PURCHASE-CREDITS] Failed to resolve story slug:", storyId, storyErr);
        return { success: false, error: "Story not found", status: 400 };
      }
      resolvedStoryId = storyRow.id;
    }

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
        return { success: false, error: "Failed to unlock story", status: 500 };
      }
    }
  }

  console.log("[PURCHASE-CREDITS] ✅ Credits applied:", { orderId, packageId, userId, updates, source });
  return { success: true, updates, profile };
}

// Amount → packageId mapping for fallback identification (Grow static links)
export function packageIdFromAmount(amount: number): string | null {
  const a = Math.round(amount * 100) / 100;
  if (a === 39.9) return "single_story_digital";
  if (a === 99.9) return "popular";
  if (a === 9.9) return "coloring_single";
  if (a === 24.9) return "coloring_bundle";
  if (a === 59.9) return "pdf";
  return null;
}