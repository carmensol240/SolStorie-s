const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// DISABLED: this endpoint was unauthenticated, used the service role and
// overwrote images in the public topic-images bucket. Nothing in the site calls it.
Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  console.warn("[generate-topic-images] Disabled endpoint called");
  return new Response(JSON.stringify({ error: "Gone: this endpoint is disabled" }), {
    status: 410,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
