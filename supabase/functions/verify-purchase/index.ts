import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHITELISTED_TEST_EMAIL = "carmit1901+test@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { orderId, packageId, amount, userId, couponCode, storyId, testMode } = await req.json();

    // Validate inputs
    if (!orderId || !packageId || !amount || !userId) {
      // testMode is allowed to have amount=0
      if (!(testMode && orderId && packageId && userId)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
      }
    }

    console.log(`[VERIFY-PURCHASE] Starting verification for order: ${orderId}, package: ${packageId}, user: ${userId}`);

    // Service-role client (used for everything below)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // ===== TEST MODE BYPASS =====
    if (testMode === true) {
      // Verify user email matches the whitelisted test account
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(userId);
      if (userErr || !userData?.user) {
        console.error("[VERIFY-PURCHASE] testMode: user lookup failed", userErr);
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      const email = (userData.user.email || "").toLowerCase();
      if (email !== WHITELISTED_TEST_EMAIL.toLowerCase()) {
        console.error("[VERIFY-PURCHASE] testMode rejected for non-test user:", email);
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      console.log("[VERIFY-PURCHASE] ✅ testMode authorized for", email);
    } else {
    // Verify PayPal order
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!paypalClientId || !paypalSecret) {
      console.error("[VERIFY-PURCHASE] PayPal credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Get PayPal access token
    const isLive = !paypalClientId.startsWith("Ac9EH"); // sandbox client IDs start with this
    const paypalBase = isLive
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("[VERIFY-PURCHASE] Failed to get PayPal token:", tokenErr);
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const { access_token } = await tokenRes.json();

    // Verify the order
    const orderRes = await fetch(`${paypalBase}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!orderRes.ok) {
      const orderErr = await orderRes.text();
      console.error("[VERIFY-PURCHASE] Failed to get order:", orderErr);
      return new Response(
        JSON.stringify({ error: "Order verification failed" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const order = await orderRes.json();
    console.log("[VERIFY-PURCHASE] Order status:", order.status);

    if (order.status !== "COMPLETED") {
      console.error("[VERIFY-PURCHASE] Order not completed:", order.status);
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Verify amount matches
    const paidAmount = parseFloat(order.purchase_units?.[0]?.amount?.value || "0");
    if (Math.abs(paidAmount - amount) > 1) {
      console.error(`[VERIFY-PURCHASE] Amount mismatch: paid ${paidAmount}, expected ${amount}`);
      return new Response(
        JSON.stringify({ error: "Amount mismatch" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
    }
    // ===== end PayPal verification =====

    // Check for duplicate purchase (idempotency)
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .eq("package_name", `paypal_${orderId}`)
      .maybeSingle();

    if (existingPurchase) {
      console.log("[VERIFY-PURCHASE] Duplicate order, already processed:", orderId);
      return new Response(
        JSON.stringify({ success: true, duplicate: true }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Determine what to credit based on packageId
    const packageConfig: Record<string, any> = {
      basic: { stories: 2, freeEdits: 2, coloringPages: 2 },
      popular: { stories: 6, freeEdits: 6, coloringPages: 6 },
      premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
      educator_basic: { stories: 2, freeEdits: 2, coloringPages: 2 },
      educator_popular: { stories: 6, freeEdits: 6, coloringPages: 6 },
      educator_premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
      coloring_kit: { stories: 0, freeEdits: 0, coloringPages: 5 },
      coloring_single: { stories: 0, freeEdits: 0, coloringPages: 1 },
      coloring_story: { stories: 0, freeEdits: 0, coloringPages: 0, dynamicColoringFromStory: true },
      edit_kit: { stories: 0, freeEdits: 0, coloringPages: 0, editingCredits: 5 },
      toolkit_yearly: { stories: 0, freeEdits: 0, coloringPages: 0, isSubscription: true },
      single_story: { stories: 0, freeEdits: 0, coloringPages: 0 },
      single_story_digital: { stories: 1, freeEdits: 1, coloringPages: 0 },
      single_story_full: { stories: 1, freeEdits: 1, coloringPages: 1 },
    };

    const config = packageConfig[packageId];
    if (!config) {
      console.error("[VERIFY-PURCHASE] Unknown package:", packageId);
      return new Response(
        JSON.stringify({ error: "Unknown package" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Dynamic coloring credits — count illustrations in the story
    if (config.dynamicColoringFromStory) {
      let resolvedStoryUuid: string | null = null;
      if (storyId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(storyId)) {
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
        // Fallback: typical story has 5 illustrations
        config.coloringPages = 5;
      }
      console.log("[VERIFY-PURCHASE] coloring_story → credits:", config.coloringPages);
    }

    // Insert purchase record
    const packagePrefix = testMode ? "test" : "paypal";
    const packageName = couponCode ? `${packageId}_coupon_${couponCode}` : packageId;
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userId,
      package_name: `${packagePrefix}_${orderId}_${packageName}`,
      credits_purchased: config.stories || 0,
      amount_ils: testMode ? 0 : amount,
      status: testMode ? "test_completed" : "completed",
    });

    if (purchaseError) {
      console.error("[VERIFY-PURCHASE] Failed to insert purchase:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to record purchase" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("story_credits, free_edits_remaining, free_edits_total, coloring_credits, editing_credits, is_subscriber")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("[VERIFY-PURCHASE] Failed to get profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to get user profile" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Build update object
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

    // Update profile
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (updateError) {
        console.error("[VERIFY-PURCHASE] Failed to update profile:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update credits" }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert story unlock for single-story purchases
    if (packageId === "single_story" && storyId) {
      // storyId may be a UUID or a slug — resolve to UUID
      let resolvedStoryId: string | null = null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(storyId)) {
        resolvedStoryId = storyId;
      } else {
        const { data: storyRow, error: storyErr } = await supabase
          .from("stories")
          .select("id")
          .eq("slug", storyId)
          .maybeSingle();
        if (storyErr || !storyRow) {
          console.error("[VERIFY-PURCHASE] Failed to resolve story slug:", storyId, storyErr);
          return new Response(
            JSON.stringify({ error: "Story not found" }),
            { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
          );
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
        // Ignore duplicate unlocks (user already owns it) — treat as success
        if ((unlockError as any).code === "23505") {
          console.log("[VERIFY-PURCHASE] Story already unlocked for user, continuing");
        } else {
        console.error("[VERIFY-PURCHASE] Failed to insert story unlock:", unlockError);
        return new Response(
          JSON.stringify({ error: "Failed to unlock story" }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
        }
      }
    }

    console.log("[VERIFY-PURCHASE] ✅ Purchase verified and credits updated:", {
      orderId,
      packageId,
      userId,
      updates,
    });

    // Send notification email (non-blocking)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const { data: buyerData } = await supabase.auth.admin.getUserById(userId);
        const buyerEmail = buyerData?.user?.email || "unknown";
        const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        const amountStr = testMode ? "0 (test)" : `${amount} ₪`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SoulStory <onboarding@resend.dev>",
            to: ["solstories.nlp@gmail.com"],
            subject: `רכישה חדשה: ${packageId}`,
            html: `<div dir="rtl"><h2>רכישה חדשה בוצעה ✅</h2>
              <p><b>חבילה:</b> ${packageId}</p>
              <p><b>סכום:</b> ${amountStr}</p>
              <p><b>מייל הקונה:</b> ${buyerEmail}</p>
              <p><b>תאריך ושעה:</b> ${now}</p>
              <p><b>Order ID:</b> ${orderId}</p></div>`,
          }),
        });
      }
    } catch (mailErr) {
      console.error("[VERIFY-PURCHASE] Notification email failed:", mailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        credits: {
          storyCredits: updates.story_credits ?? profile.story_credits,
          coloringCredits: updates.coloring_credits ?? profile.coloring_credits,
          editingCredits: updates.editing_credits ?? profile.editing_credits,
          freeEditsRemaining: updates.free_edits_remaining ?? profile.free_edits_remaining,
          isSubscriber: updates.is_subscriber ?? profile.is_subscriber,
        },
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[VERIFY-PURCHASE] Unexpected error:", error);

    // Log to error_logs
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      await supabase.from("error_logs").insert({
        error_type: "verify_purchase_error",
        error_message: String(error),
        metadata: { stack: error?.stack },
      });
    } catch (_) { /* ignore logging errors */ }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
