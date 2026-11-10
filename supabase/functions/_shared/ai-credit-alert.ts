// "AI balance ran out" detection + admin alert (red banner in the dashboard) + email,
// at most one alert/email per hour. Never throws.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const AI_CREDIT_ALERT_TYPE = "ai_credits_exhausted";
export const AI_CREDIT_ALERT_MESSAGE = "נגמרה יתרת ה-AI. לקוחות לא יכולים ליצור סיפורים";
export const AI_CREDIT_ALERT_EMAIL = "carmit1901@gmail.com";
export const AI_CREDIT_ALERT_INTERVAL_MS = 60 * 60 * 1000;

/** 402, or a 403 workspace credit-limit / payment-required answer from the AI service. */
export function isAiCreditError(status: unknown, body?: unknown): boolean {
  const s = Number(status);
  const text = typeof body === "string" ? body : body == null ? "" : JSON.stringify(body);
  if (s === 402) return true;
  if (s === 403 && /credit_limit|payment_required|not enough credits|top_up/i.test(text)) return true;
  return false;
}

/** True when no alert was raised in the last hour (so a new alert + email may go out). */
export function shouldRaiseCreditAlert(lastAlertAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!lastAlertAt) return true;
  const t = new Date(lastAlertAt).getTime();
  if (!Number.isFinite(t)) return true;
  return now.getTime() - t >= AI_CREDIT_ALERT_INTERVAL_MS;
}

export async function reportAiCreditIssue(source: string, status: number, userId?: string | null): Promise<void> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);

    const since = new Date(Date.now() - AI_CREDIT_ALERT_INTERVAL_MS).toISOString();
    const { data: last } = await sb.from("admin_alerts").select("created_at")
      .eq("alert_type", AI_CREDIT_ALERT_TYPE).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!shouldRaiseCreditAlert((last as any)?.created_at)) return; // already alerted this hour

    // admin_alerts.user_id is required: the affected user, else the first admin.
    let alertUser = userId || null;
    if (!alertUser) {
      const { data: admin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      alertUser = (admin as any)?.user_id ?? null;
    }
    if (!alertUser) return;

    const { data: mine, error: insErr } = await sb.from("admin_alerts").insert({
      user_id: alertUser,
      alert_type: AI_CREDIT_ALERT_TYPE,
      message: `${AI_CREDIT_ALERT_MESSAGE} (${source}, HTTP ${status})`,
    }).select("id").single();
    if (insErr || !mine) { console.error("[ai-credit-alert] insert failed:", insErr?.message); return; }

    // Two failures at the same moment: only the earliest alert of this hour sends the email.
    const { data: first } = await sb.from("admin_alerts").select("id")
      .eq("alert_type", AI_CREDIT_ALERT_TYPE).gte("created_at", since)
      .order("created_at", { ascending: true }).order("id", { ascending: true }).limit(1).maybeSingle();
    if ((first as any)?.id && (first as any).id !== (mine as any).id) {
      await sb.from("admin_alerts").delete().eq("id", (mine as any).id);
      return;
    }

    const resend = Deno.env.get("RESEND_API_KEY");
    if (!resend) { console.warn("[ai-credit-alert] RESEND_API_KEY missing — email skipped"); return; }
    const now = new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SolStorie's™ <noreply@soulstory.co.il>",
        to: [AI_CREDIT_ALERT_EMAIL],
        subject: `🔴 ${AI_CREDIT_ALERT_MESSAGE}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif">
          <h2 style="color:#b91c1c">${AI_CREDIT_ALERT_MESSAGE}</h2>
          <p>שירות ה-AI החזיר שגיאת יתרה (HTTP ${status}) ב-${source}.</p>
          <p>זמן: ${now}</p>
          <p>יש להוסיף יתרה כדי שהורים יוכלו ליצור סיפורים. מייל נוסף יישלח לכל היותר פעם בשעה.</p>
          <p><a href="https://soulstory.co.il/admin/dashboard">לוח הבקרה</a></p></div>`,
      }),
    });
    if (!res.ok) console.error("[ai-credit-alert] email failed", res.status, await res.text());
  } catch (e) {
    console.error("[ai-credit-alert] failed:", (e as Error)?.message);
  }
}
