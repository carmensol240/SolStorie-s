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
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this child's photo into a 3D Disney Pixar cartoon animation style portrait, inspired by 'Coco' and 'Encanto'.

The character must look like an adorable cartoon doll — NOT a realistic human.

CRITICAL REQUIREMENTS:
- Keep the EXACT same facial features, hair color, hair style, and skin tone from the photo
- Maintain the same clothing colors and style
- Big round expressive cartoon eyes with sparkling highlights
- Soft rounded cute face, smooth stylized skin with NO pores or texture
- Exaggerated cute proportions with large head and expressive face
- Warm magical golden lighting
- Friendly, happy expression
- 3D rounded shapes with smooth surfaces
- Simple, clean background (soft gradient or solid pastel color)
- Portrait style, showing head and upper body (shoulders and chest visible — NOT just a floating head)
- Clean sharp 3D rendering, rich textures

NEGATIVE PROMPT / EXCLUDE: realistic, semi-realistic, real human, photograph, photorealistic, floating head, disembodied head, head without body, missing body, missing limbs, extra limbs, deformed, distorted, scary, grotesque, mutated, disfigured, cropped head only, cinematic bokeh, dark, muted colors.

The result must look like a cartoon doll version of the child — immediately recognizable as the same child, but NEVER looking like a real human. Always stylized 3D cartoon doll style.`
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
    const userMessage = error instanceof Error && error.message.startsWith("שגיאה") 
      ? error.message 
      : "שגיאה בעיבוד הבקשה";
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
