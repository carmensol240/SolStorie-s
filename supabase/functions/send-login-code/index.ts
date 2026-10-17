import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  CODE_TTL_MS, EMAIL_COOLDOWN_MS, EMAIL_PER_HOUR, IP_PER_HOUR, SITE_PER_DAY,
  hmac, randomCode, randomToken, normalizeEmail, safeReturnTo, clientIp,
} from "../_shared/login-code.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Same response whether the address is new, existing or rate-limited (no account enumeration).
const OK = { ok: true };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }
  const email = normalizeEmail(body?.email);
  if (!email) return json({ error: "invalid_email" }, 400);
  const returnTo = safeReturnTo(body?.returnTo);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ipHash = await hmac("ip:" + clientIp(req));
  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();

  // Site-wide daily cap
  const { count: dayCount } = await admin.from("login_codes").select("id", { count: "exact", head: true })
    .gte("created_at", new Date(now - 86400_000).toISOString());
  if ((dayCount ?? 0) >= SITE_PER_DAY) {
    console.error("[send-login-code] site daily cap reached");
    const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1);
    if (admins?.[0]) {
      const today = new Date().toISOString().slice(0, 10);
      const { count: existing } = await admin.from("admin_alerts").select("id", { count: "exact", head: true })
        .eq("alert_type", "login_code_daily_cap").gte("created_at", today);
      if (!existing) {
        await admin.from("admin_alerts").insert({
          user_id: admins[0].user_id, alert_type: "login_code_daily_cap",
          message: `הגענו לתקרה היומית של ${SITE_PER_DAY} קודי התחברות במייל. שליחות נוספות נחסמות עד מחר.`,
        });
      }
    }
    return json({ ok: false, error: "busy" }, 429);
  }

  // Per-IP hourly limit
  const { count: ipCount } = await admin.from("login_codes").select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash).gte("created_at", hourAgo);
  if ((ipCount ?? 0) >= IP_PER_HOUR) return json(OK);

  // Per-email cooldown + hourly limit
  const { data: recent } = await admin.from("login_codes").select("created_at")
    .eq("email", email).gte("created_at", hourAgo).order("created_at", { ascending: false });
  if ((recent?.length ?? 0) >= EMAIL_PER_HOUR) return json(OK);
  if (recent?.[0] && now - new Date(recent[0].created_at).getTime() < EMAIL_COOLDOWN_MS) return json(OK);

  const code = randomCode();
  const linkToken = randomToken();

  // A new code cancels older unused ones
  await admin.from("login_codes").update({ superseded: true }).eq("email", email).is("used_at", null).eq("superseded", false);

  const { error: insErr } = await admin.from("login_codes").insert({
    email,
    code_hash: await hmac(`code:${email}:${code}`),
    link_token_hash: await hmac("link:" + linkToken),
    ip_hash: ipHash,
    return_to: returnTo,
    expires_at: new Date(now + CODE_TTL_MS).toISOString(),
  });
  if (insErr) {
    console.error("[send-login-code] insert failed", insErr);
    return json({ error: "server" }, 500);
  }

  const link = `https://soulstory.co.il/auth?login_token=${linkToken}&returnTo=${encodeURIComponent(returnTo)}`;
  const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#FAF3E8;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 20px;">
  <div style="background:#ffffff;border-radius:20px;padding:32px 24px;text-align:center;">
    <div style="font-size:24px;font-weight:900;color:#7c3aed;margin-bottom:8px;">SolStorie's™</div>
    <h1 style="font-size:20px;color:#2d1b4e;margin:0 0 16px;">קוד הכניסה שלכם</h1>
    <div dir="ltr" style="font-size:36px;font-weight:900;letter-spacing:8px;color:#2d1b4e;background:#f5f0ff;border-radius:14px;padding:16px 0;margin:0 0 20px;">${code}</div>
    <p style="font-size:16px;color:#444;margin:0 0 20px;">הקלידו את הקוד באתר, או לחצו על הכפתור:</p>
    <a href="${link}" style="display:inline-block;background:#c2541c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:999px;">כניסה בלחיצה</a>
    <p style="font-size:14px;color:#777;margin:24px 0 0;">הקוד והקישור בתוקף ל-10 דקות ולשימוש חד-פעמי.<br>לא ביקשתם קוד? אפשר להתעלם מהמייל.</p>
  </div>
  <p style="font-size:12px;color:#999;text-align:center;margin-top:16px;">© ${new Date().getFullYear()} SolStorie's™</p>
</div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}` },
    body: JSON.stringify({
      from: "SolStories <noreply@soulstory.co.il>",
      to: [email],
      subject: `קוד הכניסה שלכם ל-SolStories: ${code}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error(`[send-login-code] Resend failed [${res.status}]: ${await res.text()}`);
    return json({ error: "send_failed" }, 502);
  }
  console.log("[send-login-code] sent", (await res.json())?.id);
  return json(OK);
});
