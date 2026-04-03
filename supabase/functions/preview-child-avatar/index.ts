import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GUEST_RATE_LIMIT = { maxRequests: 2, windowMs: 60 * 60 * 1000 }; // 2 per hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === OPTIONAL AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        console.log("Authenticated user:", userId.substring(0, 8) + "...");
      } else {
        console.log("Auth token invalid, proceeding as guest");
      }
    } else {
      console.log("No auth header, proceeding as guest");
    }

    // Rate limit: by user ID if authenticated, by IP if guest
    if (userId) {
      const rateLimit = checkRateLimit(userId, "preview-avatar", RATE_LIMITS.aiFunction);
      if (!rateLimit.allowed) {
        console.log(`Rate limit exceeded for user: ${userId}`);
        return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
      }
    } else {
      const clientIP = getClientIP(req);
      const rateLimit = checkRateLimit(clientIP, "preview-avatar-guest", GUEST_RATE_LIMIT);
      if (!rateLimit.allowed) {
        console.log(`Guest rate limit exceeded for IP: ${clientIP}`);
        return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
      }
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
        model: "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this child's photo into a cute 3D Pixar-style cartoon character portrait. Keep the same face, hair, skin tone, and clothing. Make it look like a cartoon doll with big expressive eyes, rounded features, and warm lighting. Show head and upper body. Simple pastel background. Output ONLY the image, no text.`
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
    console.log("AI response received, keys:", JSON.stringify(Object.keys(data)));

    // Try multiple response formats
    let previewUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Fallback: check for inline_data in content parts
    if (!previewUrl) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imagePart = content.find((p: any) => p.type === 'image_url' || p.inline_data || p.image_url);
        if (imagePart?.image_url?.url) {
          previewUrl = imagePart.image_url.url;
        } else if (imagePart?.inline_data?.data) {
          previewUrl = `data:${imagePart.inline_data.mime_type || 'image/png'};base64,${imagePart.inline_data.data}`;
        }
      }
    }

    // Fallback: check for image in top-level of message
    if (!previewUrl) {
      const msg = data.choices?.[0]?.message;
      if (msg?.image?.url) previewUrl = msg.image.url;
    }
    
    if (!previewUrl) {
      console.error("No image in response. Full structure:", JSON.stringify(data).substring(0, 2000));
      throw new Error("שגיאה ביצירת התצוגה המקדימה");
    }

    console.log("Preview generated successfully");

    return new Response(
      JSON.stringify({ previewUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating preview:", error);
    const userMessage = error instanceof Error && error.message.startsWith("שגיאה") 
      ? error.message 
      : "שגיאה בעיבוד הבקשה";
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
