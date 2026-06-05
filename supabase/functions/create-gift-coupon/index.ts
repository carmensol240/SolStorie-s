import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const generateCouponCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This endpoint is DISABLED. Gift coupons are now issued only by the
  // payment-verified flow in `grow-webhook` (matched against `pending_gifts`).
  // The previous implementation allowed any authenticated user to mint
  // unlimited gift coupons without payment verification.
  console.warn("[create-gift-coupon] Disabled endpoint called");
  return new Response(
    JSON.stringify({ error: "Gone: gift coupons are issued only via verified payment webhook" }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
