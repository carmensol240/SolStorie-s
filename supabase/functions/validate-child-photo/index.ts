import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── In-memory IP + user rate limiter ──
// Prevents abuse of the (expensive) AI vision endpoint by anonymous or
// scripted callers. Limits each IP to 10 requests / minute and each
// authenticated user to 20 requests / minute.
const RATE_WINDOW_MS = 60_000;
const IP_LIMIT = 10;
const USER_LIMIT = 20;
const rateBuckets = new Map<string, number[]>();
function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const arr = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= limit) {
    rateBuckets.set(key, arr);
    return true;
  }
  arr.push(now);
  rateBuckets.set(key, arr);
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authentication ──
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!bearer) {
      return new Response(
        JSON.stringify({ error: "Missing auth" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Rate limiting (IP + user) ──
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (isRateLimited(`ip:${ip}`, IP_LIMIT) || isRateLimited(`u:${user.id}`, USER_LIMIT)) {
      return new Response(
        JSON.stringify({ error: "יותר מדי בקשות, נסו שוב בעוד דקה" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { childPhoto } = await req.json();

    if (!childPhoto) {
      return new Response(
        JSON.stringify({ error: "No photo provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Max 10MB
    if (childPhoto.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "התמונה גדולה מדי" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this child's photo and evaluate it against these 4 criteria. Return ONLY a JSON object with boolean values, no other text.

Criteria:
1. facingForward - Is the face clearly visible and facing forward (not turned sideways or hidden)?
2. singlePerson - Is there only one person/child in the photo?
3. noAccessories - Is the child NOT wearing accessories that hide the face (sunglasses, hat covering face, mask)?
4. goodLighting - Is the lighting good and the photo clear (not too dark, not blurry)?

Return exactly this JSON format:
{"facingForward": true/false, "singlePerson": true/false, "noAccessories": true/false, "goodLighting": true/false}`
              },
              {
                type: "image_url",
                image_url: { url: childPhoto }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "validate_photo",
              description: "Return photo validation results",
              parameters: {
                type: "object",
                properties: {
                  facingForward: { type: "boolean", description: "Face is visible and facing forward" },
                  singlePerson: { type: "boolean", description: "Only one person in the photo" },
                  noAccessories: { type: "boolean", description: "No face-hiding accessories" },
                  goodLighting: { type: "boolean", description: "Good lighting and clear photo" },
                },
                required: ["facingForward", "singlePerson", "noAccessories", "goodLighting"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "validate_photo" } },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסו שוב בעוד כמה דקות" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "השירות אינו זמין זמנית" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI validation failed");
    }

    const data = await response.json();
    console.log("AI response received for photo validation");

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const validation = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ validation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const validation = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify({ validation }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Could not parse validation results");

  } catch (error) {
    console.error("Error validating photo:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בבדיקת התמונה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
