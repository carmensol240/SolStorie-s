import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map amounts to package configs (used when webhook fires without client-side context)
const AMOUNT_TO_PACKAGE: Record<number, { id: string; stories: number; freeEdits: number; coloringPages: number; editingCredits?: number; isSubscription?: boolean }> = {
  39:    { id: "basic",    stories: 3,  freeEdits: 3,  coloringPages: 1 },
  59:    { id: "basic",    stories: 2,  freeEdits: 2,  coloringPages: 2 },
  79.9:  { id: "single_story_full", stories: 1, freeEdits: 1, coloringPages: 1 },
  49.9:  { id: "basic",    stories: 1,  freeEdits: 1,  coloringPages: 0 },
  69.9:  { id: "pdf",      stories: 0,  freeEdits: 0,  coloringPages: 0 },
  129.9: { id: "popular",  stories: 1,  freeEdits: 1,  coloringPages: 1 },
  99:    { id: "popular",  stories: 10, freeEdits: 10, coloringPages: 3 },
  119:   { id: "premium",  stories: 15, freeEdits: 15, coloringPages: 5 },
  149:   { id: "popular",  stories: 6,  freeEdits: 6,  coloringPages: 6 },
  199:   { id: "educator_premium", stories: 10, freeEdits: 10, coloringPages: 10 },
  219:   { id: "premium",  stories: 10, freeEdits: 10, coloringPages: 10 },
  229:   { id: "educator", stories: 20, freeEdits: 25, coloringPages: 8 },
  19.9:  { id: "coloring_kit", stories: 0, freeEdits: 0, coloringPages: 5 },
  6.9:   { id: "coloring_single", stories: 0, freeEdits: 0, coloringPages: 1 },
  9.9:   { id: "edit_kit",    stories: 0, freeEdits: 0, coloringPages: 0, editingCredits: 5 },
  29.9:  { id: "toolkit_yearly", stories: 0, freeEdits: 0, coloringPages: 0, isSubscription: true },
};

function findPackageByAmount(amount: number) {
  // Try exact match first
  if (AMOUNT_TO_PACKAGE[amount]) return AMOUNT_TO_PACKAGE[amount];
  // Try rounding to 1 decimal
  const rounded = Math.round(amount * 10) / 10;
  if (AMOUNT_TO_PACKAGE[rounded]) return AMOUNT_TO_PACKAGE[rounded];
  // Try closest match within ₪2
  for (const [key, val] of Object.entries(AMOUNT_TO_PACKAGE)) {
    if (Math.abs(parseFloat(key) - amount) <= 2) return val;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = await req.json();
    const eventType = body.event_type;

    console.log(`[PAYPAL-WEBHOOK] Received event: ${eventType}`);

    // Only process completed payments
    if (eventType !== "CHECKOUT.ORDER.COMPLETED" && eventType !== "PAYMENT.CAPTURE.COMPLETED") {
      console.log("[PAYPAL-WEBHOOK] Ignoring non-payment event:", eventType);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Extract order ID from the event
    let orderId: string | null = null;
    let paidAmount = 0;
    let payerEmail: string | null = null;

    if (eventType === "CHECKOUT.ORDER.COMPLETED") {
      const resource = body.resource;
      orderId = resource?.id;
      paidAmount = parseFloat(resource?.purchase_units?.[0]?.amount?.value || "0");
      payerEmail = resource?.payer?.email_address || resource?.payment_source?.paypal?.email_address || null;
    } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = body.resource;
      orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id;
      paidAmount = parseFloat(resource?.amount?.value || "0");
      payerEmail = resource?.payer?.email_address || null;
    }

    if (!orderId) {
      console.error("[PAYPAL-WEBHOOK] No order ID found in event");
      return new Response(JSON.stringify({ error: "No order ID" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    console.log(`[PAYPAL-WEBHOOK] Order: ${orderId}, Amount: ${paidAmount}, Payer: ${payerEmail}`);

    // Check if this order was already processed (by verify-purchase or a previous webhook)
    const { data: existingPurchase } = await supabase
      .from("purchases")
      .select("id")
      .like("package_name", `%${orderId}%`)
      .maybeSingle();

    if (existingPurchase) {
      console.log("[PAYPAL-WEBHOOK] ✅ Order already processed:", orderId);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Verify order with PayPal API independently
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!paypalClientId || !paypalSecret) {
      console.error("[PAYPAL-WEBHOOK] PayPal credentials not configured");
      await logError(supabase, "paypal_webhook_error", "PayPal credentials not configured", { orderId });
      return new Response(JSON.stringify({ error: "Config error" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const isLive = !paypalClientId.startsWith("Ac9EH");
    const paypalBase = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    // Get PayPal access token
    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      console.error("[PAYPAL-WEBHOOK] Failed to get PayPal token");
      await logError(supabase, "paypal_webhook_error", "Failed to get PayPal token", { orderId });
      return new Response(JSON.stringify({ error: "Auth error" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { access_token } = await tokenRes.json();

    // Verify the order status
    const orderRes = await fetch(`${paypalBase}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("[PAYPAL-WEBHOOK] Failed to verify order:", errText);
      await logError(supabase, "paypal_webhook_error", "Failed to verify order", { orderId, error: errText });
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const order = await orderRes.json();
    if (order.status !== "COMPLETED") {
      console.log("[PAYPAL-WEBHOOK] Order not completed:", order.status);
      return new Response(JSON.stringify({ received: true, status: order.status }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Get verified amount
    const verifiedAmount = parseFloat(order.purchase_units?.[0]?.amount?.value || "0");
    const verifiedEmail = order.payer?.email_address || order.payment_source?.paypal?.email_address || payerEmail;

    console.log(`[PAYPAL-WEBHOOK] Verified: amount=${verifiedAmount}, email=${verifiedEmail}`);

    // Find user by email
    if (!verifiedEmail) {
      console.error("[PAYPAL-WEBHOOK] No payer email found");
      await logError(supabase, "paypal_webhook_no_email", "No payer email for webhook order", { orderId, amount: verifiedAmount });
      return new Response(JSON.stringify({ error: "No payer email" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Look up user by email in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, story_credits, free_edits_remaining, free_edits_total, coloring_credits, editing_credits, is_subscriber, email")
      .eq("email", verifiedEmail)
      .maybeSingle();

    if (!profile) {
      console.error("[PAYPAL-WEBHOOK] No user found for email:", verifiedEmail);
      await logError(supabase, "paypal_webhook_no_user", `No user found for email: ${verifiedEmail}`, { orderId, amount: verifiedAmount, email: verifiedEmail });
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Determine package from amount
    const pkg = findPackageByAmount(verifiedAmount);
    if (!pkg) {
      console.error("[PAYPAL-WEBHOOK] Unknown amount:", verifiedAmount);
      await logError(supabase, "paypal_webhook_unknown_amount", `Unknown purchase amount: ${verifiedAmount}`, { orderId, amount: verifiedAmount, userId: profile.id });
      return new Response(JSON.stringify({ error: "Unknown amount" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Insert purchase record
    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: profile.id,
      package_name: `webhook_${orderId}_${pkg.id}`,
      credits_purchased: pkg.stories,
      amount_ils: verifiedAmount,
      status: "completed",
    });

    if (purchaseError) {
      console.error("[PAYPAL-WEBHOOK] Failed to insert purchase:", purchaseError);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Update profile credits
    const updates: Record<string, any> = {};
    if (pkg.stories > 0) {
      updates.story_credits = (profile.story_credits ?? 0) + pkg.stories;
    }
    if (pkg.freeEdits > 0) {
      updates.free_edits_remaining = (profile.free_edits_remaining ?? 0) + pkg.freeEdits;
      updates.free_edits_total = (profile.free_edits_total ?? 0) + pkg.freeEdits;
    }
    if (pkg.coloringPages > 0) {
      updates.coloring_credits = (profile.coloring_credits ?? 0) + pkg.coloringPages;
    }
    if (pkg.editingCredits && pkg.editingCredits > 0) {
      updates.editing_credits = (profile.editing_credits ?? 0) + pkg.editingCredits;
    }
    if (pkg.isSubscription) {
      updates.is_subscriber = true;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (updateError) {
        console.error("[PAYPAL-WEBHOOK] Failed to update profile:", updateError);
      }
    }

    console.log("[PAYPAL-WEBHOOK] ✅ Webhook backup processed successfully:", {
      orderId,
      packageId: pkg.id,
      userId: profile.id,
      amount: verifiedAmount,
      updates,
    });

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[PAYPAL-WEBHOOK] Unexpected error:", error);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      await logError(supabase, "paypal_webhook_crash", String(error), { stack: error?.stack });
    } catch (_) { /* ignore */ }

    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

async function logError(supabase: any, errorType: string, message: string, metadata: any) {
  try {
    await supabase.from("error_logs").insert({
      error_type: errorType,
      error_message: message,
      metadata,
    });
  } catch (_) { /* ignore */ }
}
