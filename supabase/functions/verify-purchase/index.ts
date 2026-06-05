import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { applyPurchaseCredits } from "../_shared/purchase-credits.ts";

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
    // Require authenticated caller and ensure the JWT user matches the body userId
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

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

    // Validate the caller's JWT and assert it matches the supplied userId
    {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !authData?.user?.id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
      if (authData.user.id !== userId) {
        console.error("[VERIFY-PURCHASE] userId mismatch: jwt=%s body=%s", authData.user.id, userId);
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
    }

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
      if (Number(amount) > 0) {
        console.warn("[VERIFY-PURCHASE] ⚠️ testMode received non-zero amount, forcing to 0:", amount);
      }
    } else {
      // PayPal has been removed. Grow is the sole active payment provider
      // and is verified server-side via the grow-webhook function. The only
      // remaining caller of verify-purchase is the whitelisted testMode flow.
      console.error("[VERIFY-PURCHASE] Non-test request rejected — PayPal is no longer supported");
      return new Response(
        JSON.stringify({ error: "Payment provider not supported" }),
        { status: 410, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Apply credits via shared module (handles idempotency, package map, profile updates, story unlocks)
    const result = await applyPurchaseCredits({
      supabase,
      userId,
      packageId,
      amount: testMode ? 0 : amount,
      orderId,
      source: "test",
      storyId,
      couponCode,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: result.status ?? 500, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    if (result.duplicate) {
      return new Response(
        JSON.stringify({ success: true, duplicate: true }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const updates = result.updates ?? {};
    const profile = result.profile ?? {};

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
