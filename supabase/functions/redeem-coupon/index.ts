import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "קוד קופון חסר" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch coupon
    const { data: coupon, error: couponError } = await adminClient
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ error: "קוד קופון לא תקף" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "הקופון פג תוקף" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max uses
    if (coupon.max_uses !== null && (coupon.current_uses ?? 0) >= coupon.max_uses) {
      return new Response(JSON.stringify({ error: "הקופון מוצה" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already redeemed
    const { data: existingRedemption } = await adminClient
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", userId)
      .single();

    if (existingRedemption) {
      return new Response(JSON.stringify({ error: "כבר השתמשת בקופון זה" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process based on type
    let result: { type: string; value: number } | null = null;

    if (coupon.coupon_type === "extra_stories" && coupon.free_stories) {
      // Add credits to user profile
      const { data: profile, error: profileFetchError } = await adminClient
        .from("profiles")
        .select("story_credits")
        .eq("id", userId)
        .single();

      if (profileFetchError || !profile) {
        console.error("Failed to fetch profile for coupon redemption:", profileFetchError);
        return new Response(JSON.stringify({ error: "שגיאה בטעינת הפרופיל" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const currentCredits = profile?.story_credits ?? 0;

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ story_credits: currentCredits + coupon.free_stories })
        .eq("id", userId);

      if (updateError) {
        console.error("Failed to add story credits from coupon:", updateError);
        return new Response(JSON.stringify({ error: "שגיאה בהוספת הסיפורים לחשבון" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = { type: "extra_stories", value: coupon.free_stories };
    } else if (coupon.coupon_type === "discount" && coupon.discount_percent) {
      result = { type: "discount", value: coupon.discount_percent };
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "סוג קופון לא תקין" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record redemption
    await adminClient.from("coupon_redemptions").insert({
      coupon_id: coupon.id,
      user_id: userId,
    });

    // Increment usage count
    await adminClient
      .from("coupons")
      .update({ current_uses: (coupon.current_uses ?? 0) + 1 })
      .eq("id", coupon.id);

    console.log(`Coupon ${coupon.code} redeemed by user ${userId.substring(0, 8)}... type=${result.type}`);

    return new Response(
      JSON.stringify({
        success: true,
        coupon_type: result.type,
        value: result.value,
        code: coupon.code,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error in redeem-coupon:", err);
    return new Response(JSON.stringify({ error: "שגיאה באימות הקופון" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
