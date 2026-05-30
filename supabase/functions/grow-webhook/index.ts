import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { applyPurchaseCredits, packageIdFromAmount } from "../_shared/purchase-credits.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Find a user_id by email using the auth admin API (paginates through users)
async function findUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (let i = 0; i < 10; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const match = data.users.find((u: any) => (u.email || "").toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}

function flattenFormData(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    obj[k] = typeof v === "string" ? v : "";
  }
  return obj;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // Always 200 OK to Grow on parse/handler errors — they retry aggressively otherwise.
  const ok = (body: Record<string, any> = { received: true }) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse body — Grow sends form-data, but tolerate JSON too
    let payload: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        payload = await req.json();
      } else {
        const fd = await req.formData();
        payload = flattenFormData(fd);
        // Grow may nest fields under "data[...]" — flatten common ones
        for (const k of Object.keys(payload)) {
          const m = k.match(/^data\[(.+)\]$/);
          if (m) payload[m[1]] = payload[k];
          const m2 = k.match(/^data\[customFields\]\[(.+)\]$/);
          if (m2) {
            payload.customFields = payload.customFields || {};
            (payload.customFields as any)[m2[1]] = payload[k];
          }
        }
      }
    } catch (e) {
      console.error("[GROW-WEBHOOK] Failed to parse body:", e);
      return ok({ received: true, warning: "unparseable_body" });
    }

    const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
    const statusCode = String(data.statusCode ?? payload.statusCode ?? "");
    const transactionId = String(data.transactionId ?? payload.transactionId ?? "");
    const sumStr = String(data.sum ?? payload.sum ?? "0");
    const amount = parseFloat(sumStr) || 0;
    const payerEmail = String(data.payerEmail ?? payload.payerEmail ?? "").trim();
    const customFields =
      (data.customFields && typeof data.customFields === "object" ? data.customFields : null) ||
      (payload.customFields && typeof payload.customFields === "object" ? payload.customFields : null) ||
      {};

    console.log("[GROW-WEBHOOK] Received:", {
      statusCode,
      transactionId,
      amount,
      payerEmail,
      customFields,
    });

    // Only process successful payments (Grow statusCode "2" = paid)
    if (statusCode !== "2") {
      console.log("[GROW-WEBHOOK] Ignoring non-success status:", statusCode);
      return ok({ received: true, ignored: true, reason: "not_paid" });
    }

    if (!transactionId) {
      console.error("[GROW-WEBHOOK] Missing transactionId");
      return ok({ received: true, warning: "missing_transaction_id" });
    }

    // Identify user: customFields.cField1 first, then payerEmail
    let userId: string | null = null;
    if (customFields.cField1 && typeof customFields.cField1 === "string") {
      userId = customFields.cField1.trim() || null;
    }
    if (!userId && payerEmail) {
      userId = await findUserIdByEmail(supabase, payerEmail);
    }
    if (!userId) {
      console.error("[GROW-WEBHOOK] Could not identify user for tx:", transactionId, payerEmail);
      await supabase.from("error_logs").insert({
        error_type: "grow_webhook_unknown_user",
        error_message: `Could not resolve user for Grow tx ${transactionId}`,
        metadata: { transactionId, payerEmail, amount, customFields },
      });
      return ok({ received: true, warning: "unknown_user" });
    }

    // Identify package: customFields.cField2 first, then amount→packageId
    let packageId: string | null = null;
    if (customFields.cField2 && typeof customFields.cField2 === "string") {
      packageId = customFields.cField2.trim() || null;
    }
    if (!packageId) {
      packageId = packageIdFromAmount(amount);
    }
    if (!packageId) {
      console.error("[GROW-WEBHOOK] Could not identify package for amount:", amount);
      await supabase.from("error_logs").insert({
        error_type: "grow_webhook_unknown_package",
        error_message: `Could not resolve package for Grow tx ${transactionId} amount ${amount}`,
        metadata: { transactionId, payerEmail, amount, customFields },
      });
      return ok({ received: true, warning: "unknown_package" });
    }

    const storyId =
      customFields.cField3 && typeof customFields.cField3 === "string"
        ? customFields.cField3.trim() || null
        : null;

    // Apply credits via shared module (idempotent by source+transactionId)
    const result = await applyPurchaseCredits({
      supabase,
      userId,
      packageId,
      amount,
      orderId: transactionId,
      source: "grow",
      storyId,
    });

    if (!result.success) {
      console.error("[GROW-WEBHOOK] applyPurchaseCredits failed:", result.error);
      await supabase.from("error_logs").insert({
        error_type: "grow_webhook_credit_failure",
        error_message: result.error || "unknown",
        metadata: { transactionId, userId, packageId, amount },
      });
      // Still return 200 so Grow doesn't keep retrying.
      return ok({ received: true, warning: result.error });
    }

    if (result.duplicate) {
      return ok({ received: true, duplicate: true });
    }

    // Notification email via Resend (non-blocking)
    try {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const { data: buyerData } = await supabase.auth.admin.getUserById(userId);
        const buyerEmail = buyerData?.user?.email || payerEmail || "unknown";
        const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SoulStory <onboarding@resend.dev>",
            to: ["solstories.nlp@gmail.com"],
            subject: `רכישה חדשה (Grow): ${packageId}`,
            html: `<div dir="rtl"><h2>רכישה חדשה דרך Grow ✅</h2>
              <p><b>חבילה:</b> ${packageId}</p>
              <p><b>סכום:</b> ${amount} ₪</p>
              <p><b>מייל הקונה:</b> ${buyerEmail}</p>
              <p><b>תאריך ושעה:</b> ${now}</p>
              <p><b>Transaction ID:</b> ${transactionId}</p></div>`,
          }),
        });
      }
    } catch (mailErr) {
      console.error("[GROW-WEBHOOK] Notification email failed:", mailErr);
    }

    return ok({ received: true, success: true, packageId });
  } catch (error: any) {
    console.error("[GROW-WEBHOOK] Unexpected error:", error);
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("error_logs").insert({
        error_type: "grow_webhook_error",
        error_message: String(error),
        metadata: { stack: error?.stack },
      });
    } catch (_) { /* ignore */ }
    // Still 200 — log & swallow so Grow doesn't keep retrying a poison payload.
    return ok({ received: true, error: "internal" });
  }
});