import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  PIXAR_STYLE_COMPACT,
  NEGATIVE_PROMPT_FULL,
  CHARACTER_CARDS,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🎨 Generating hero image for app welcome screen...");

    const heroPrompt = `${PIXAR_STYLE_COMPACT}

SCENE: "Gateway to the Magical World" — A magnificent, enormous glowing magical portal/gateway made of golden swirling light and sparkling fairy dust stands in the center. The portal opens to reveal a fantastical world full of vivid colors — floating islands, rainbow waterfalls, giant colorful flowers, and shimmering butterflies. The sky behind is a breathtaking gradient of purple, pink, and deep blue with twinkling stars and magical sparkles.

CHARACTERS (all 5 must appear together, standing in front of the magical portal, excited and ready for adventure):
1. ${CHARACTER_CARDS.sol_hero}. She stands at the front-center, leading the group with one arm raised invitingly toward the portal, big warm smile, as if saying "come with us!"
2. ${CHARACTER_CARDS.mia}. She stands to Sol's left, leaning forward with wide curious eyes, hands clasped together in excitement.
3. ${CHARACTER_CARDS.leo}. He stands to Sol's right, holding up a large glowing rainbow-colored magic pencil that emits sparkles. He has a thoughtful, friendly smile.
4. ${CHARACTER_CARDS.ben}. He is the smallest, peeking out from behind Sol with wide amazed eyes and a shy sweet smile.
5. ${CHARACTER_CARDS.zoe}. She stands on the far side in a dynamic, energetic pose — one fist pumping the air, soccer ball tucked under her other arm. Big confident grin.

HEIGHT RELATIONSHIPS: Sol, Mia, Leo, and Zoe are roughly the same height. Ben is noticeably shorter — the youngest and smallest in the group.

TITLE TEXT: Display the text "SolStorie's™" prominently at the TOP of the image in a large, bold, magical, child-friendly English font. The text should have a warm golden color with a subtle glow effect and sparkles around it. The ™ symbol should be small but visible. The text must be clearly legible and beautifully integrated as a logo/brand title.

COMPOSITION: This is an APP WELCOME SCREEN / HERO IMAGE. The magical portal fills the background. The 5 characters are arranged as an inviting group in the lower two-thirds, facing the viewer. The "SolStorie's™" title is at the top with clean space around it. The overall mood is magical, inviting, warm, exciting — making children want to enter this world.

ATMOSPHERE: Magical golden light emanating from the portal bathes the characters in warm glow. Fairy dust particles float everywhere. The colors are rich and saturated — purples, golds, pinks, greens. Everything sparkles and glows. Portrait orientation (9:16 aspect ratio).

NEGATIVE: ${NEGATIVE_PROMPT_FULL}. No additional characters beyond the 5 described. No UI elements, no buttons, no audio icons, no play buttons, no text beyond "SolStorie's™".`;

    const requestBody = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: heroPrompt,
      }],
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Hero image generation failed:", response.status);
      const errText = await response.text();
      console.error("Error body:", errText);
      return new Response(JSON.stringify({ error: "Hero image generation failed", status: response.status }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response");
      return new Response(JSON.stringify({ error: "No hero image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to topic-images bucket (public) for easy access
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = "hero-welcome.png";
    const { error: uploadError } = await supabase.storage
      .from("topic-images")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Hero upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Hero upload failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("topic-images")
      .getPublicUrl(filePath);

    console.log(`✅ Hero image generated and saved! URL: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrlData.publicUrl,
        base64: imageUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-hero-image error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
