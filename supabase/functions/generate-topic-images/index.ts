import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEGATIVE = "floating head, disembodied head, missing limbs, extra limbs, deformed, distorted, scary, horror, grotesque, mutated, disfigured, extra fingers, bad anatomy, ugly, blurry, watermark, text, signature";

const TOPIC_PROMPTS: Record<string, { filename: string; prompt: string }> = {
  "blood-test": {
    filename: "topic-blood-test.png",
    prompt: `A heartwarming Disney Pixar 3D animation style illustration, 9:16 portrait aspect ratio. A brave little girl named Sol with tanned olive skin, big warm brown eyes, and a high ponytail held by a pink-purple scrunchie, wearing a colorful casual outfit. She is sitting on a doctor's office chair, smiling proudly and showing a shiny golden star sticker on the back of her hand after a blood test. The background is a cheerful, bright pediatric clinic with friendly medical posters and soft pastel colors. Full body shot from waist up, character centered in the middle third of the frame. Ultra high resolution. Style reference: Disney Pixar 3D animation, vibrant colors, soft lighting. Negative prompt: ${NEGATIVE}`,
  },
  "helping-at-home": {
    filename: "topic-helping-at-home.png",
    prompt: `A heartwarming Disney Pixar 3D animation style illustration, 9:16 portrait aspect ratio. A cute toddler boy named Ben with very dark brown, extremely curly and voluminous hair, wearing a green t-shirt and comfortable pants. He is happily tidying up colorful toys into a toy box in a bright, cheerful children's room. He holds a stuffed teddy bear in one hand and is placing a toy car into the box with the other. The room has warm lighting, a cozy rug, and shelves with books. Full body shot, character centered in the middle third of the frame. Ultra high resolution. Style reference: Disney Pixar 3D animation, vibrant colors, soft lighting. Negative prompt: ${NEGATIVE}`,
  },
  "home-of-love": {
    filename: "topic-home-of-love.png",
    prompt: `A heartwarming Disney Pixar 3D animation style illustration, 9:16 portrait aspect ratio. A little girl named Sol with tanned olive skin, big warm brown eyes, and a high ponytail held by a pink-purple scrunchie, hugging her mother warmly. The mother has similar features with long dark hair and a loving smile. They are in a cozy, warm living room with soft golden light streaming through a window. The scene emphasizes the deep bond between a single mother and her daughter. Both are smiling with genuine joy. Shot from waist up, characters centered in the middle third of the frame. Ultra high resolution. Style reference: Disney Pixar 3D animation, vibrant colors, emotional warmth, soft lighting. Negative prompt: ${NEGATIVE}`,
  },
  "eating-with-cutlery": {
    filename: "topic-eating-with-cutlery.png",
    prompt: `High-end cinematic 3D Disney Pixar portrait, 1:1 square aspect ratio. A 4-year-old girl named Sol with tanned olive skin, dark wavy shoulder-length hair with natural volume, soft freckles across her nose and cheeks, big warm expressive brown eyes with detailed eyelashes and light reflections. She sits at a small colorful table, proudly and correctly holding a small shiny fork in one hand and a small spoon in the other over a stylized plate of colorful mini pasta pieces. She looks directly at the camera with a confident, proud, happy expression showing her new skill. Soft warm cinematic golden-hour lighting illuminating her face with gentle rim light. Extremely shallow depth of field with deeply blurred creamy bokeh background of warm indistinct golden lights and blended soft green tones. Intricate detail in hair texture, eyelashes, and eye reflections. Octane render quality, volumetric fog. Full upper body from waist up, character centered. Ultra high resolution. Negative prompt: ${NEGATIVE}, eating with hands, messy eating, dirty hands, floating food`,
  },
  "playing-together": {
    filename: "topic-playing-together.png",
    prompt: `A heartwarming Disney Pixar 3D animation style illustration, 9:16 portrait aspect ratio. Two children playing together in a sunny garden: Mia, a girl with a brown bob haircut wearing a green dress, and Leo, a boy with glasses wearing denim overalls and holding a magic pencil behind his ear. They are sharing a colorful ball between them, both smiling and laughing. The garden has green grass, flowers, butterflies, and a bright blue sky. Full body shot, both characters centered in the middle third of the frame. Ultra high resolution. Style reference: Disney Pixar 3D animation, vibrant colors, joyful atmosphere, soft natural lighting. Negative prompt: ${NEGATIVE}`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { topicIds } = await req.json() as { topicIds?: string[] };
    const idsToGenerate = topicIds || Object.keys(TOPIC_PROMPTS);

    const results: Record<string, { url: string; status: string }> = {};

    for (const topicId of idsToGenerate) {
      const config = TOPIC_PROMPTS[topicId];
      if (!config) {
        results[topicId] = { url: "", status: "unknown topic" };
        continue;
      }

      console.log(`Generating image for topic: ${topicId}`);

      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [
                { role: "user", content: config.prompt },
              ],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${topicId}:`, aiResponse.status, errText);
          results[topicId] = { url: "", status: `ai_error_${aiResponse.status}` };
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData =
          aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData || !imageData.startsWith("data:image")) {
          console.error(`No image returned for ${topicId}`);
          results[topicId] = { url: "", status: "no_image_returned" };
          continue;
        }

        // Extract base64
        const base64 = imageData.split(",")[1];
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("topic-images")
          .upload(config.filename, bytes, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${topicId}:`, uploadError);
          results[topicId] = { url: "", status: "upload_error" };
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("topic-images")
          .getPublicUrl(config.filename);

        results[topicId] = { url: publicUrl.publicUrl, status: "success" };
        console.log(`✅ ${topicId}: ${publicUrl.publicUrl}`);
      } catch (err) {
        console.error(`Error for ${topicId}:`, err);
        results[topicId] = { url: "", status: "error" };
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-topic-images error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
