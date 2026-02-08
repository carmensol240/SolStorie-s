import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader, "starts with Bearer:", authHeader?.startsWith("Bearer "));
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid auth header. Header value:", authHeader ? `${authHeader.substring(0, 15)}...` : "null");
      return new Response(
        JSON.stringify({ error: "נדרשת התחברות" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "טוקן לא תקין או שפג תוקפו" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // === END AUTHENTICATION CHECK ===

    // Rate limit by user ID (more reliable than IP)
    const rateLimit = checkRateLimit(user.id, "preview-avatar", RATE_LIMITS.aiFunction);
    if (!rateLimit.allowed) {
      console.log(`Preview avatar rate limit exceeded for user: ${user.id}`);
      return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
    }

    const { childPhoto } = await req.json();
    
    if (!childPhoto) {
      return new Response(
        JSON.stringify({ error: "No photo provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation - max 10MB for base64 photo
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
    if (childPhoto.length > MAX_PHOTO_SIZE) {
      return new Response(
        JSON.stringify({ error: "התמונה גדולה מדי (מקסימום 10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating 3D preview for child photo...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this child's photo into a 3D Pixar/Disney animation style portrait.
                
CRITICAL REQUIREMENTS:
- Keep the EXACT same facial features, hair color, hair style, and skin tone
- Maintain the same clothing colors and style
- Make it look like a character from a Pixar movie (like "Coco", "Inside Out", or "Luca")
- Use soft, warm lighting
- Friendly, happy expression
- 3D rounded shapes with smooth surfaces
- Simple, clean background (soft gradient or solid pastel color)
- Portrait style, showing head and shoulders
- High quality, professional animation look

The result should be immediately recognizable as the same child, just in beautiful 3D animation style.`
              },
              {
                type: "image_url",
                image_url: {
                  url: childPhoto
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות. נסו שוב בעוד כמה דקות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "השירות אינו זמין זמנית." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("שגיאה ביצירת התצוגה המקדימה");
    }

    const data = await response.json();
    console.log("AI response received");

    const previewUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!previewUrl) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("שגיאה ביצירת התצוגה המקדימה");
    }

    console.log("Preview generated successfully");

    return new Response(
      JSON.stringify({ previewUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating preview:", error);
    // Return generic error message to client, keep details in server logs
    const userMessage = error instanceof Error && error.message.startsWith("שגיאה") 
      ? error.message 
      : "שגיאה בעיבוד הבקשה";
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
