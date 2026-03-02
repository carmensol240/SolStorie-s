import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEGATIVE = "realistic, semi-realistic, real human, photograph, photorealistic, floating head, disembodied head, missing limbs, extra limbs, deformed, distorted, scary, horror, grotesque, mutated, disfigured, extra fingers, bad anatomy, ugly, blurry, watermark, text, signature, cinematic bokeh, dark, muted colors, hyper-realistic";

const TOPIC_PROMPTS: Record<string, { filename: string; prompt: string }> = {
  "blood-test": {
    filename: "topic-blood-test.png",
    prompt: `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. 9:16 portrait aspect ratio. A brave little girl named Sol with tanned olive skin, big round expressive cartoon eyes with sparkling highlights, and a high ponytail held by a pink-purple scrunchie, wearing a colorful casual outfit. Soft rounded cute face, smooth stylized skin. She is sitting on a doctor's office chair, smiling proudly and showing a shiny golden star sticker on the back of her hand after a blood test. The background is a cheerful, bright pediatric clinic with friendly medical posters and magical sparkles. Full body shot from waist up, character centered. Vibrant rich saturated colors, warm magical golden lighting. Clean sharp 3D rendering. Characters must NEVER look like real humans — always stylized 3D cartoon dolls. Negative prompt: ${NEGATIVE}`,
  },
  "helping-at-home": {
    filename: "topic-helping-at-home.png",
    prompt: `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. 9:16 portrait aspect ratio. A cute toddler boy named Ben with very dark brown, extremely curly and voluminous hair, big round expressive cartoon eyes, soft rounded cute face, smooth stylized skin, wearing a green t-shirt and comfortable pants. He is happily tidying up colorful toys into a toy box in a bright, cheerful children's room. He holds a stuffed teddy bear in one hand and is placing a toy car into the box with the other. The room has warm magical golden lighting, a cozy rug, and shelves with books. Full body shot, character centered. Vibrant rich saturated colors. Clean sharp 3D rendering. Characters must NEVER look like real humans — always stylized 3D cartoon dolls. Negative prompt: ${NEGATIVE}`,
  },
  "home-of-love": {
    filename: "topic-home-of-love.png",
    prompt: `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. 9:16 portrait aspect ratio. A little girl named Sol with tanned olive skin, big round expressive cartoon eyes with sparkling highlights, and a high ponytail held by a pink-purple scrunchie, hugging her mother warmly. The mother has similar features with long dark hair and a loving smile. Both have soft rounded cute faces and smooth stylized skin. They are in a cozy, warm living room with soft magical golden light streaming through a window. The scene emphasizes the deep bond between a single mother and her daughter. Both are smiling with genuine joy. Shot from waist up, characters centered. Vibrant rich saturated colors, warm magical golden lighting. Clean sharp 3D rendering. Characters must NEVER look like real humans — always stylized 3D cartoon dolls. Negative prompt: ${NEGATIVE}`,
  },
  "eating-with-cutlery": {
    filename: "topic-eating-with-cutlery.png",
    prompt: `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. 1:1 square aspect ratio. Vibrant rich saturated colors, warm magical golden lighting. A 4-year-old girl named Sol with tanned olive skin, dark wavy shoulder-length hair with natural volume, big round expressive cartoon eyes with sparkling highlights, soft rounded cute face, smooth stylized skin with NO pores. She sits at a small colorful table, proudly and correctly holding a small shiny fork in one hand and a small spoon in the other over a stylized plate of colorful mini pasta pieces. She looks directly at the camera with a confident, proud, happy expression showing her new skill. Colorful detailed background with warm kitchen elements and magical sparkles. Clean sharp 3D rendering, rich textures, playful and whimsical atmosphere. Full upper body from waist up, character centered. Characters must NEVER look like real humans — always stylized 3D cartoon dolls. Negative prompt: ${NEGATIVE}`,
  },
  "playing-together": {
    filename: "topic-playing-together.png",
    prompt: `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. 9:16 portrait aspect ratio. Two children playing together in a sunny magical garden: Mia, a girl with a brown bob haircut wearing a green dress, and Leo, a boy with glasses wearing denim overalls and holding a magic pencil behind his ear. Both have big round expressive cartoon eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin. They are sharing a colorful ball between them, both smiling and laughing. The garden has green grass, glowing flowers, butterflies, and a bright blue sky with magical sparkles. Full body shot, both characters centered. Vibrant rich saturated colors, warm magical golden lighting. Clean sharp 3D rendering. Characters must NEVER look like real humans — always stylized 3D cartoon dolls. Negative prompt: ${NEGATIVE}`,
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
              model: "google/gemini-2.5-flash-image",
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
