import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("first_purchase_bonus_given, story_credits")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) {
      return new Response(JSON.stringify({ granted: false, reason: "no_profile" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (profile.first_purchase_bonus_given) {
      return new Response(JSON.stringify({ granted: false, alreadyGranted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Verify user actually has a completed purchase ──
    // Prevents the bonus from being granted just by calling this endpoint
    // without ever paying.
    const { count: completedCount, error: purchaseErr } = await admin
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");
    if (purchaseErr) throw purchaseErr;
    if (!completedCount || completedCount < 1) {
      return new Response(
        JSON.stringify({ granted: false, reason: "no_completed_purchase" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: uErr } = await admin
      .from("profiles")
      .update({
        first_purchase_bonus_given: true,
        story_credits: (profile.story_credits ?? 0) + 1,
      })
      .eq("id", userId)
      .eq("first_purchase_bonus_given", false);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ granted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("grant-first-purchase-bonus error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});