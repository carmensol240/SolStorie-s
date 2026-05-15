import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Adjust to actual instance plan as needed
const DB_LIMIT_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB

function prettyBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "?";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
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

    // --- DB size via PostgREST RPC fallback: use a direct query through service role ---
    let dbResult: { size_bytes: number | null; size_pretty: string; limit_bytes: number; error?: string } = {
      size_bytes: null, size_pretty: "?", limit_bytes: DB_LIMIT_BYTES,
    };
    try {
      // Use Supabase Management-style via direct PG query through service role REST is not available.
      // Use a simple SQL via supabase.rpc to a known function — fall back to pg_database_size through a temp postgres-meta call.
      // Easiest: call PostgREST OpenAPI is not enough; instead use the @supabase/supabase-js .rpc on a function we don't have.
      // Use Deno postgres client.
      const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (dbUrl) {
        const client = new Client(dbUrl);
        await client.connect();
        const res = await client.queryObject<{ size: bigint }>("SELECT pg_database_size(current_database()) AS size");
        await client.end();
        const size = Number(res.rows[0]?.size ?? 0);
        dbResult = { size_bytes: size, size_pretty: prettyBytes(size), limit_bytes: DB_LIMIT_BYTES };
      } else {
        dbResult.error = "SUPABASE_DB_URL not set";
      }
    } catch (e) {
      dbResult.error = e instanceof Error ? e.message : String(e);
    }

    // --- Resend: count emails sent this calendar month ---
    let resendResult: { sent_this_month: number; ok: boolean; error: string | null } = {
      sent_this_month: 0, ok: false, error: null,
    };
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      resendResult.error = "RESEND_API_KEY not set";
    } else {
      try {
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();
        let count = 0;
        let cursor: string | undefined;
        let done = false;
        let pages = 0;
        while (!done && pages < 20) {
          pages++;
          const url = new URL("https://api.resend.com/emails");
          url.searchParams.set("limit", "100");
          if (cursor) url.searchParams.set("after", cursor);
          const resp = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${resendKey}` },
          });
          if (!resp.ok) {
            resendResult.error = `Resend API ${resp.status}`;
            break;
          }
          const json = await resp.json();
          const items: Array<{ id: string; created_at: string }> = json.data ?? [];
          if (items.length === 0) { done = true; break; }
          for (const item of items) {
            const ts = new Date(item.created_at).getTime();
            if (ts >= monthStart) count++;
            else { done = true; }
          }
          if (done) break;
          cursor = items[items.length - 1].id;
          if (!json.has_more) done = true;
        }
        if (!resendResult.error) {
          resendResult = { sent_this_month: count, ok: true, error: null };
        }
      } catch (e) {
        resendResult.error = e instanceof Error ? e.message : String(e);
      }
    }

    return new Response(JSON.stringify({ db: dbResult, resend: resendResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});