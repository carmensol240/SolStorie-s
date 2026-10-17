import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { MAX_ATTEMPTS, hmac, normalizeEmail } from "../_shared/login-code.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_body" }, 400); }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const nowIso = new Date().toISOString();
  let row: any = null;

  if (typeof body?.linkToken === "string" && /^[a-f0-9]{64}$/.test(body.linkToken)) {
    const { data } = await admin.from("login_codes").select("*")
      .eq("link_token_hash", await hmac("link:" + body.linkToken)).maybeSingle();
    if (!data || data.used_at || data.superseded || data.expires_at < nowIso) return json({ error: "expired" }, 400);
    row = data;
  } else {
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (!email || code.length !== 6) return json({ error: "invalid" }, 400);
    const { data } = await admin.from("login_codes").select("*")
      .eq("email", email).is("used_at", null).eq("superseded", false)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!data || data.expires_at < nowIso) return json({ error: "expired" }, 400);
    if (data.attempts >= MAX_ATTEMPTS) return json({ error: "too_many" }, 429);
    if (data.code_hash !== await hmac(`code:${email}:${code}`)) {
      const attempts = data.attempts + 1;
      await admin.from("login_codes").update({ attempts }).eq("id", data.id);
      return json({ error: attempts >= MAX_ATTEMPTS ? "too_many" : "wrong_code", remaining: Math.max(0, MAX_ATTEMPTS - attempts) }, 400);
    }
    row = data;
  }

  // Single use: only the first request that flips used_at continues
  const { data: claimed } = await admin.from("login_codes").update({ used_at: nowIso })
    .eq("id", row.id).is("used_at", null).select("id");
  if (!claimed?.length) return json({ error: "expired" }, 400);

  // Account is created only now, after verification. Existing address → same account.
  const { error: createErr } = await admin.auth.admin.createUser({ email: row.email, email_confirm: true });
  if (createErr && !/already|registered|exists/i.test(createErr.message)) {
    console.error("[verify-login-code] createUser failed", createErr);
    return json({ error: "server" }, 500);
  }

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email: row.email });
  if (linkErr || !link?.properties?.hashed_token) {
    console.error("[verify-login-code] generateLink failed", linkErr);
    return json({ error: "server" }, 500);
  }
  return json({ ok: true, token_hash: link.properties.hashed_token, email: row.email, returnTo: row.return_to || "/create" });
});
