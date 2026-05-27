import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface BuildMinutes {
  used?: number;
  included?: number;
  period_start?: string;
  period_end?: string;
  error?: string;
}
interface Bandwidth {
  used_bytes?: number;
  included_bytes?: number;
  period_start?: string;
  period_end?: string;
  error?: string;
}
interface LastDeploy {
  state?: string;
  created_at?: string;
  deploy_time?: number | null;
  branch?: string;
  url?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await adminClient
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const netlifyToken = Deno.env.get("NETLIFY_API_TOKEN");
    const accountId = Deno.env.get("NETLIFY_ACCOUNT_ID");
    const siteId = Deno.env.get("NETLIFY_SITE_ID");

    const authHeaders = { Authorization: `Bearer ${netlifyToken}` };

    let build_minutes: BuildMinutes = {};
    let bandwidth: Bandwidth = {};
    let last_deploy: LastDeploy = {};

    // Account capabilities (build minutes + bandwidth)
    const accountPromise = (async () => {
      if (!netlifyToken) { build_minutes.error = bandwidth.error = "NETLIFY_API_TOKEN not set"; return; }
      if (!accountId) { build_minutes.error = bandwidth.error = "NETLIFY_ACCOUNT_ID not set"; return; }
      try {
        const resp = await fetch(`https://api.netlify.com/api/v1/accounts/${accountId}`, { headers: authHeaders });
        if (!resp.ok) {
          const msg = `Netlify API ${resp.status}`;
          build_minutes.error = msg; bandwidth.error = msg; return;
        }
        const json = await resp.json();
        const caps = json?.capabilities ?? {};
        const bm = caps.build_minutes ?? {};
        const bw = caps.bandwidth ?? {};
        build_minutes = {
          used: typeof bm.used === "number" ? bm.used : undefined,
          included: typeof bm.included === "number" ? bm.included : undefined,
          period_start: bm.period_start_date ?? bm.period_start,
          period_end: bm.period_end_date ?? bm.period_end,
        };
        bandwidth = {
          used_bytes: typeof bw.used === "number" ? bw.used : undefined,
          included_bytes: typeof bw.included === "number" ? bw.included : undefined,
          period_start: bw.period_start_date ?? bw.period_start,
          period_end: bw.period_end_date ?? bw.period_end,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        build_minutes.error = msg; bandwidth.error = msg;
      }
    })();

    // Last deploy
    const deployPromise = (async () => {
      if (!netlifyToken) { last_deploy.error = "NETLIFY_API_TOKEN not set"; return; }
      if (!siteId) { last_deploy.error = "NETLIFY_SITE_ID not set"; return; }
      try {
        const resp = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys?per_page=1`, { headers: authHeaders });
        if (!resp.ok) { last_deploy.error = `Netlify API ${resp.status}`; return; }
        const arr = await resp.json();
        const d = Array.isArray(arr) ? arr[0] : null;
        if (!d) { last_deploy.error = "No deploys"; return; }
        last_deploy = {
          state: d.state,
          created_at: d.created_at,
          deploy_time: d.deploy_time ?? null,
          branch: d.branch,
          url: d.deploy_ssl_url ?? d.deploy_url ?? d.url,
        };
      } catch (e) {
        last_deploy.error = e instanceof Error ? e.message : String(e);
      }
    })();

    await Promise.all([accountPromise, deployPromise]);

    return new Response(JSON.stringify({ build_minutes, bandwidth, last_deploy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});