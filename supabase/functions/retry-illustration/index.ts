import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Adventure/fantasy topics → Sol Hero; all others → Sol Casual
const ADVENTURE_TOPICS = new Set([
  "space-adventure", "magic-kingdom", "zoo-adventure", "cloud-adventure",
  "magic-castle", "magic-keys", "magical-forest", "space-hero", "kingdom",
  "underwater", "superheroes", "fantasy", "adventure", "dragon", "princess",
  "pirate", "fairy", "wizard",
]);
const SOL_CASUAL_URL = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20casual.png";
const SOL_HERO_URL   = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20hero.png";
const CHARACTER_BASE_REFS = [
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/ben.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/zoe.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/leo.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/mia.jpeg",
];
function getSolUrl(topic: string): { url: string; label: string } {
  const isAdventure = ADVENTURE_TOPICS.has(topic);
  return { url: isAdventure ? SOL_HERO_URL : SOL_CASUAL_URL, label: isAdventure ? "Sol hero" : "Sol casual" };
}

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storyId, pageId, customPrompt } = await req.json();
    if (!storyId || !pageId) {
      return new Response(JSON.stringify({ error: "Missing storyId or pageId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, user_id, child_gender, age_range, child_name, topic")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (storyError || !story) {
      return new Response(JSON.stringify({ error: "Story not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the page
    const { data: page, error: pageError } = await supabase
      .from("story_pages")
      .select("*")
      .eq("id", pageId)
      .eq("story_id", storyId)
      .maybeSingle();

    if (pageError || !page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get child photo if available
    let childPhoto: string | null = null;
    const { data: child } = await supabase
      .from("children")
      .select("avatar_url, photo_url, avatar_description")
      .eq("user_id", user.id)
      .eq("name", story.child_name)
      .maybeSingle();

    const photoPath = child?.avatar_url || child?.photo_url;
    if (photoPath) {
      if (photoPath.startsWith("http")) {
        childPhoto = photoPath;
      } else if (photoPath.startsWith("data:")) {
        // Upload base64 to storage for HTTP URL — Instant Character works better with URLs
        console.log(`🖼️ Child photo is a data URI — uploading to storage for HTTP URL...`);
        try {
          const base64Content = photoPath.split(",")[1] || photoPath;
          const binaryStr = atob(base64Content);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          const tempPath = `temp-refs/${user.id}/${Date.now()}.png`;
          const { error: uploadErr } = await supabase.storage
            .from("child-photos")
            .upload(tempPath, bytes, { contentType: "image/png", upsert: true });
          if (!uploadErr) {
            const { data: signedData } = await supabase.storage
              .from("child-photos")
              .createSignedUrl(tempPath, 600);
            childPhoto = signedData?.signedUrl || photoPath;
          } else {
            childPhoto = photoPath; // fallback to data URI
          }
        } catch {
          childPhoto = photoPath;
        }
      } else {
        const { data: signedData } = await supabase.storage
          .from("child-photos")
          .createSignedUrl(photoPath, 600);
        if (signedData?.signedUrl) childPhoto = signedData.signedUrl;
      }
    }

    // Select correct Sol variant based on story topic
    const sol = getSolUrl(story.topic || "");
    console.log(`Sol variant: ${sol.label} for topic "${story.topic}"`);

    const prompt = customPrompt || page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      return new Response(JSON.stringify({ error: "FAL_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stylePrefix = `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. Big round expressive cartoon eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin with NO pores or texture. Exaggerated cute proportions with large heads, small noses, and expressive faces. Vibrant rich saturated colors, warm magical golden lighting. Colorful detailed backgrounds with magical fantasy elements (glowing mushrooms, fireflies, sparkles, enchanted forests). Clean sharp 3D rendering, rich textures, playful and whimsical atmosphere. ALWAYS show characters FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface. Frame the character with generous margin from all edges. DO NOT render flat, photorealistic, semi-realistic, dark, muted, cinematic bokeh, or hyper-realistic styles. Characters must NEVER look like real humans or photographs — always stylized 3D cartoon dolls.`;

    const negativePrompt = `realistic, semi-realistic, real human, photograph, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field, floating head, missing body, missing limbs, extra limbs, deformed, distorted, scary, horror, mutated, cropped feet, cut off legs, floating character, half-body, missing feet, text, watermark, UI elements`;

    let imageUrl: string | null = null;
    const MAX_ATTEMPTS = 2;

    // Branch: use PuLID when child photo exists, Schnell otherwise
    if (childPhoto) {
      console.log(`Retrying illustration via Flux Kontext (face reference) for story ${storyId}, page ${page.page_number}...`);

      const personalizedPrompt = `CRITICAL FACE REFERENCE: The main character's face, hair texture, skin tone, and facial features MUST be an EXACT 3D Pixar rendering of the child in the reference photo. Do NOT invent or change any facial features.

3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. Big round expressive cartoon eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin with NO pores or texture. Exaggerated cute proportions with large heads, small noses, and expressive faces. Vibrant rich saturated colors, warm magical golden lighting. Colorful detailed backgrounds with magical fantasy elements (glowing mushrooms, fireflies, sparkles, enchanted forests). Clean sharp 3D rendering, rich textures, playful and whimsical atmosphere. DO NOT render flat, photorealistic, semi-realistic, dark, muted, cinematic bokeh, or hyper-realistic styles. Characters must NEVER look like real humans or photographs — always stylized 3D cartoon dolls.

MAIN CHARACTER: The child from the reference photo — HERO and FOCAL POINT, LARGEST figure.

SCENE: ${prompt}

SUPPORTING CAST (smaller, background only):
- Ben: toddler boy, voluminous curly dark hair, warm tan skin, green shirt, large brown eyes — 3D Pixar cartoon style
- Zoe: dark-skinned athletic girl, thick voluminous black curls, blue headband, purple-yellow tracksuit — 3D Pixar cartoon style
- Leo: boy with straight black hair, round glasses, denim overalls — 3D Pixar cartoon style
- Mia: girl with smooth brown bob, small flower crown, green dress — 3D Pixar cartoon style

FULL BODY head to toe, feet GROUNDED on surface. Portrait 4:3 framing. NEGATIVE: ${negativePrompt}`;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Flux Kontext attempt ${attempt}/${MAX_ATTEMPTS}...`);
          const response = await fetch("https://fal.run/fal-ai/flux-kontext/dev", {
            method: "POST",
            signal: AbortSignal.timeout(30_000),
            headers: {
              Authorization: `Key ${FAL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: personalizedPrompt,
              image_url: childPhoto,
              output_format: "png",
              num_images: 1,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "no body");
            console.error(`Flux Kontext attempt ${attempt} failed: ${response.status} - ${errorBody}`);
            if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
            // Fall through to Schnell below
            break;
          }

          const data = await response.json();
          const falImageUrl = data.images?.[0]?.url;

          if (falImageUrl) {
            const imgResponse = await fetch(falImageUrl);
            if (imgResponse.ok) {
              const imgBuffer = new Uint8Array(await imgResponse.arrayBuffer());
              const chunks: string[] = [];
              for (let i = 0; i < imgBuffer.length; i += 512) {
                const end = Math.min(i + 512, imgBuffer.length);
                let chunk = '';
                for (let j = i; j < end; j++) {
                  chunk += String.fromCharCode(imgBuffer[j]);
                }
                chunks.push(chunk);
              }
              imageUrl = `data:image/png;base64,${btoa(chunks.join(''))}`;
            }
            if (imageUrl) break;
          }
          console.warn(`Instant Character attempt ${attempt}: no image`);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        } catch (fetchErr) {
          console.error(`Instant Character attempt ${attempt} error:`, fetchErr);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        }
      }
    }

    // Fallback to Schnell if no photo or PuLID failed
    if (!imageUrl) {
      const fullPrompt = `${stylePrefix}\n\nSCENE: ${prompt}\n\nNEGATIVE: ${negativePrompt}`;
      console.log(`Retrying illustration via Flux Schnell for story ${storyId}, page ${page.page_number}...`);

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Schnell attempt ${attempt}/${MAX_ATTEMPTS}...`);
          const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
            method: "POST",
            signal: AbortSignal.timeout(30_000),
            headers: {
              Authorization: `Key ${FAL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: fullPrompt,
              image_size: "portrait_4_3",
              num_inference_steps: 4,
              num_images: 1,
              enable_safety_checker: true,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "no body");
            console.error(`Schnell attempt ${attempt} failed: ${response.status} - ${errorBody}`);
            if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
            return new Response(JSON.stringify({ error: "Image generation failed" }), {
              status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const data = await response.json();
          const falImageUrl = data.images?.[0]?.url;

          if (falImageUrl) {
            const imgResponse = await fetch(falImageUrl);
            if (imgResponse.ok) {
              const imgBuffer = new Uint8Array(await imgResponse.arrayBuffer());
              const chunks: string[] = [];
              for (let i = 0; i < imgBuffer.length; i += 512) {
                const end = Math.min(i + 512, imgBuffer.length);
                let chunk = '';
                for (let j = i; j < end; j++) {
                  chunk += String.fromCharCode(imgBuffer[j]);
                }
                chunks.push(chunk);
              }
              imageUrl = `data:image/png;base64,${btoa(chunks.join(''))}`;
            }
            if (imageUrl) break;
          }
          console.warn(`Schnell attempt ${attempt}: no image`);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        } catch (fetchErr) {
          console.error(`Schnell attempt ${attempt} error:`, fetchErr);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        }
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated after retries" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${storyId}/page-${page.page_number}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("story_pages")
      .update({ illustration_url: filePath })
      .eq("id", pageId);

    console.log(`✅ Retry illustration success for page ${page.page_number}`);

    return new Response(
      JSON.stringify({ success: true, illustrationUrl: filePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("retry-illustration error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
