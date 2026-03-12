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

const TOPICS = [
  {
    id: "dinosaurs",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_hero} is playing joyfully with friendly, colorful dinosaurs in a lush prehistoric jungle. A big green Brachiosaurus lowers its head to nuzzle Sol while a small orange baby Triceratops stands beside her. Giant ferns, volcanic mountains in the background, and butterflies fill the warm sunlit scene. Sol is laughing with her arms wide open.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
  {
    id: "cardboard-house",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_casual} is inside a giant cardboard box that has been magically transformed into a magnificent castle with cardboard turrets, a drawbridge, and colorful crayon decorations. Sol peeks out from a cardboard window wearing a paper crown, beaming with imagination. Around her are more cardboard creations — a rocket ship and a pirate ship — all glowing with magical sparkles. A cozy playroom background.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
  {
    id: "candy-alive",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_casual} is surrounded by dancing candy that has come alive! Giant lollipops with happy faces twirl around her, colorful gummy bears march in a parade, chocolate bars sing, and cotton candy clouds float above. Sol is laughing and dancing with a giant swirly lollipop. The background is a magical candy land with gumdrop hills and a chocolate river.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
  {
    id: "talking-toys",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_casual} sits on a cozy bedroom floor at night with soft moonlight streaming through the window. Around her, toys have come alive — a cuddly teddy bear waves hello, a friendly robot with blinking lights dances, and a rag doll with yarn hair giggles. Stars and sparkles float in the air. Sol looks amazed and delighted, whispering to her toy friends.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
  {
    id: "farm-animals",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_casual} is in a sunny, colorful farm petting a fluffy white sheep while a friendly brown cow with big eyes watches. Chickens with yellow chicks peck nearby, and a pink piglet rolls in the grass. A red barn and green rolling hills fill the background under a bright blue sky with puffy clouds. Sol is smiling warmly, kneeling down to pet the animals.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
  {
    id: "unicorn",
    prompt: `${PIXAR_STYLE_COMPACT}\n\nSCENE: ${CHARACTER_CARDS.sol_hero} rides a magnificent sparkling white unicorn with a glowing rainbow mane and golden horn. They soar over a brilliant rainbow bridge surrounded by shimmering stars and colorful butterflies. Below them are rolling green meadows filled with wildflowers. Sol holds on joyfully with one hand raised in the air, her cape flowing behind her. Magical sparkles trail behind the unicorn.\n\n9:16 portrait. NEGATIVE: ${NEGATIVE_PROMPT_FULL}`,
  },
];

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
    const results: { id: string; status: string; url?: string; error?: string }[] = [];

    for (const topic of TOPICS) {
      console.log(`🎨 Generating topic image: ${topic.id}...`);

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            modalities: ["image", "text"],
            messages: [{ role: "user", content: topic.prompt }],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Failed for ${topic.id}:`, response.status, errText);
          results.push({ id: topic.id, status: "failed", error: `HTTP ${response.status}` });
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error(`No image for ${topic.id}`);
          results.push({ id: topic.id, status: "failed", error: "No image in response" });
          continue;
        }

        const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const filePath = `topic-${topic.id}.png`;
        const { error: uploadError } = await supabase.storage
          .from("topic-images")
          .upload(filePath, bytes, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error(`Upload error for ${topic.id}:`, uploadError);
          results.push({ id: topic.id, status: "failed", error: "Upload failed" });
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("topic-images")
          .getPublicUrl(filePath);

        console.log(`✅ ${topic.id} done: ${publicUrlData.publicUrl}`);
        results.push({ id: topic.id, status: "success", url: publicUrlData.publicUrl });
      } catch (err) {
        console.error(`Error for ${topic.id}:`, err);
        results.push({ id: topic.id, status: "failed", error: String(err) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Batch generation error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
