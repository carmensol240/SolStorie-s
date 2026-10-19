import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE_URL = "https://soulstory.co.il/";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !claims?.claims) return json({ error: "Unauthorized" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: role } = await admin.from("user_roles").select("role")
    .eq("user_id", claims.claims.sub as string).eq("role", "admin").maybeSingle();
  if (!role) return json({ error: "Forbidden" }, 403);

  const started = Date.now();
  try {
    const resp = await fetch(SITE_URL, { signal: AbortSignal.timeout(8000), headers: { "Cache-Control": "no-cache" } });
    const html = await resp.text();
    return json({
      ok: resp.ok,
      status: resp.status,
      response_ms: Date.now() - started,
      checked_at: new Date().toISOString(),
      build_time: html.match(/<meta name="build-time" content="([^"]+)"/)?.[1] ?? null,
      build_tag: html.match(/assets\/index-([^".]+)\.js/)?.[1] ?? null,
    });
  } catch (e) {
    return json({
      ok: false, status: null, response_ms: Date.now() - started,
      checked_at: new Date().toISOString(), error: e instanceof Error ? e.message : String(e),
    });
  }
});
