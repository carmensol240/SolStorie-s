import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// Topic-to-Setting mapping for magical cover backgrounds
const TOPIC_SETTINGS: Record<string, string> = {
  "space-adventure": "Cosmic space station floating among glowing stars, colorful planets, and shimmering nebulae",
  "bedtime-story": "Dreamy cloud kingdom with a glowing crescent moon, floating golden stars, and soft purple sky",
  "magic-kingdom": "Enchanted castle with glowing fairy dust, a sparkling rainbow bridge, and magical turrets",
  "zoo-adventure": "Magical jungle clearing with friendly glowing animals, oversized tropical flowers, and fireflies",
  "friendship-courage": "Whimsical treehouse village in an enchanted forest with glowing mushrooms and fairy lights",
  "body-hero-teeth": "Sparkling crystal cave with toothbrush-shaped crystals and rainbow waterfalls",
  "body-hero-bath": "Magical underwater bubble kingdom with rainbow soap bubbles and friendly rubber ducks",
  "body-hero-hands": "Sparkling fountain garden with rainbow water streams and glowing soap bubbles",
  "body-hero-nails": "Colorful fairy workshop with tiny magical tools and sparkling gem stones",
  "potty-training": "Colorful garden kingdom with stepping stones, blooming flowers, and a golden path",
  "clean-room": "Magical toy workshop with floating toys, spinning gears, and sparkling dust",
  "dentist-visit": "Friendly cloud hospital with rainbow bridges and smiling star decorations",
  "new-sibling": "Cozy magical nursery with floating stars, soft glowing clouds, and a rainbow mobile",
  "fears": "Enchanted night garden with friendly fireflies, soft glowing lanterns, and a protective moon",
  "friends": "Sunny magical playground with rainbow slides and floating balloons",
  "kindergarten": "Cheerful enchanted schoolhouse with colorful doors, flying books, and a magical welcome arch",
  "siblings": "Cozy magical nursery with floating stars and a glowing heart-shaped mobile",
  "confidence": "Majestic mountaintop with golden sunrise, soaring eagles, and a heroic flag",
  "nature": "Enchanted forest glade with crystal streams, giant flowers, and butterflies made of light",
  "pacifier-fairy": "Fairy tale garden with tiny fairy houses, glowing pixie dust trails, and a magical tree",
  "family-trip": "Magical landscape with rolling green hills, a winding rainbow road, and floating hot air balloons",
  "birthday-party": "Enchanted celebration hall with floating balloons, magical confetti, and a glowing cake",
};

function getSettingForTopic(topic: string): string {
  return TOPIC_SETTINGS[topic] || "Enchanted forest clearing with magical glowing light, sparkling fireflies, and a majestic ancient tree";
}

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

    const { storyId, title, topic, language } = await req.json();

    if (!storyId) {
      return new Response(JSON.stringify({ error: "Missing storyId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating cover for story ${storyId}, topic: ${topic}, title: ${title}`);

    // Look up story to find child info
    const { data: story } = await supabase
      .from("stories")
      .select("child_name, user_id")
      .eq("id", storyId)
      .maybeSingle();

    // Check if child has a photo for personalized cover
    let childPhotoSignedUrl: string | null = null;
    if (story?.user_id && story?.child_name) {
      const { data: child } = await supabase
        .from("children")
        .select("avatar_url, photo_url")
        .eq("user_id", story.user_id)
        .eq("name", story.child_name)
        .maybeSingle();

      const photoPath = child?.avatar_url || child?.photo_url;
      if (photoPath) {
        if (photoPath.startsWith("http")) {
          childPhotoSignedUrl = photoPath;
          console.log(`🖼️ Child photo (HTTP URL) found — personalizing cover`);
        } else if (photoPath.startsWith("data:")) {
          // Upload base64 to storage for HTTP URL — Instant Character works better with URLs
          console.log(`🖼️ Child photo is a data URI — uploading to storage for HTTP URL...`);
          try {
            const base64Content = photoPath.split(",")[1] || photoPath;
            const binaryStr = atob(base64Content);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
            const tempPath = `temp-refs/${story.user_id}/${Date.now()}.png`;
            const { error: uploadErr } = await supabase.storage
              .from("child-photos")
              .upload(tempPath, bytes, { contentType: "image/png", upsert: true });
            if (!uploadErr) {
              const { data: signedData } = await supabase.storage
                .from("child-photos")
                .createSignedUrl(tempPath, 600);
              childPhotoSignedUrl = signedData?.signedUrl || photoPath;
              console.log(`✅ Photo uploaded, using signed URL for cover`);
            } else {
              childPhotoSignedUrl = photoPath;
            }
          } catch {
            childPhotoSignedUrl = photoPath;
          }
        } else {
          const { data: signedData } = await supabase.storage
            .from("child-photos")
            .createSignedUrl(photoPath, 600);
          if (signedData?.signedUrl) {
            childPhotoSignedUrl = signedData.signedUrl;
            console.log(`🖼️ Child photo (storage path) found — personalizing cover`);
          }
        }
      }
    }

    const setting = getSettingForTopic(topic || "");
    const isHebrew = language === "he" || !language;
    const fontLanguage = isHebrew ? "Hebrew" : "English";
    const displayTitle = isHebrew
      ? (title && !/^[a-z\-]+$/.test(title) ? title : "סיפור קסום")
      : (title || topic || "A Magical Story");

    // Select correct Sol variant based on topic
    const sol = getSolUrl(topic || "");
    console.log(`Sol variant: ${sol.label} for topic "${topic}"`);

    // If child photo exists, use PuLID for personalized cover
    if (childPhotoSignedUrl) {
      const FAL_KEY = Deno.env.get("FAL_KEY");
      if (!FAL_KEY) {
        return new Response(JSON.stringify({ error: "FAL_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const personalizedCoverPrompt = `CRITICAL FACE REFERENCE: The main character's face, hair texture, skin tone, and facial features MUST be an EXACT 3D Pixar rendering of the child in the reference photo. Do NOT invent or change any facial features.

Pixar 3D CGI animation style, big expressive eyes, soft rounded features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book background, high quality render, Disney-Pixar aesthetic. Characters must look like adorable cartoon dolls — NOT realistic humans. Portrait orientation.
...
FULL BODY head to toe, feet GROUNDED. NEGATIVE: realistic, semi-realistic, real human, photograph, generic face, wrong hair, floating head, missing body, extra limbs, deformed, text beyond title, watermark, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field`;

      let imageUrl: string | null = null;
      const MAX_ATTEMPTS = 2;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Flux Kontext cover attempt ${attempt}/${MAX_ATTEMPTS}...`);
          const response = await fetch("https://fal.run/fal-ai/flux-kontext/dev", {
            method: "POST",
            signal: AbortSignal.timeout(30_000),
            headers: {
              Authorization: `Key ${FAL_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: personalizedCoverPrompt,
              image_url: childPhotoSignedUrl,
              output_format: "png",
              num_images: 1,
            }),
          });

          if (!response.ok) {
            console.error(`Flux Kontext cover attempt ${attempt} failed:`, response.status);
            if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
            // Fall through to Gemini path below
            break;
          }

          const data = await response.json();
          const falImageUrl = data.images?.[0]?.url;

          if (falImageUrl) {
            // Download and convert
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
          console.warn(`Flux Kontext cover attempt ${attempt}: no image`);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
        } catch (fetchErr) {
          console.error(`Flux Kontext cover attempt ${attempt} error:`, fetchErr);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
        }
      }

      // If PuLID succeeded, upload and return
      if (imageUrl) {
        const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const filePath = `${storyId}/cover.png`;
        const { error: uploadError } = await supabase.storage
          .from("story-illustrations")
          .upload(filePath, bytes, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error("Cover upload error:", uploadError);
          return new Response(JSON.stringify({ error: "Cover upload failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: publicUrlData } = supabase.storage
          .from("story-illustrations")
          .getPublicUrl(filePath);

        const fullCoverUrl = publicUrlData.publicUrl;

        await supabase
          .from("stories")
          .update({ cover_url: fullCoverUrl })
          .eq("id", storyId);

        console.log(`✅ Personalized cover generated via Flux Kontext for story ${storyId}`);

        return new Response(
          JSON.stringify({ success: true, coverUrl: fullCoverUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.warn("Flux Kontext cover failed, falling back to Gemini cover generation");
    }

    // === FALLBACK / DEFAULT: Gemini-based cover with Sol character ===
    const solDescription = sol.label === "Sol hero"
      ? "Sol in her adventure/fantasy outfit — match EXACTLY from the provided reference image"
      : "Sol in her superhero costume — warm tan skin, long dark brown hair in a high bun with pink band, red cape, light blue shirt with a golden star emblem, purple pants, white sneakers — match EXACTLY from the provided reference image";

    const coverPrompt = `Pixar 3D CGI animation style, big expressive eyes, soft rounded features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book background, high quality render, Disney-Pixar aesthetic. Characters must look like adorable cartoon dolls — NOT realistic humans. Portrait orientation (9:16 aspect ratio).

=== MANDATORY CHARACTER REFERENCES ===
Reference images of EACH character are provided above. You MUST match their appearance EXACTLY — facial features, hair color, hair style, and skin tone MUST be taken DIRECTLY from the reference images. Zero invented characters.
- Image 1 (${sol.label}): ${solDescription}
- Image 2 (Ben): Sol's LITTLE BROTHER — toddler with very curly dark hair, warm tan skin matching Sol (they are siblings) — always the SMALLEST character
- Image 3 (Zoe): Dark brown skin, voluminous afro with light blue headband, purple-yellow tracksuit, soccer ball
- Image 4 (Leo): Straight black hair, round glasses, denim overalls, rainbow pencil
- Image 5 (Mia): Smooth brown bob, small flower crown, emerald green dress

CHARACTERS (all 5 must appear together in the scene — Sol and Ben are SIBLINGS, the others are their friends):
1. Sol - match EXACTLY from reference image 1. ${solDescription}. Stands slightly to the side with a warm confident smile.
2. Mia - match EXACTLY from reference image 5. Smooth brown bob, small flower crown, emerald green dress. Gentle curious expression.
3. Leo - match EXACTLY from reference image 4. Straight black hair, round glasses, denim overalls over red-yellow striped shirt, rainbow pencil. Thoughtful friendly smile.
4. Ben (Sol's LITTLE BROTHER) - match EXACTLY from reference image 2. Very curly dark brown hair, warm tan skin like Sol — they are siblings and share similar features. Stands beside Sol or center/front, NOTICEABLY SMALLER than all others. Light green or sky blue shirt. Toddler-sized.
5. Zoe - match EXACTLY from reference image 3. Dark brown skin, voluminous afro with light blue headband, purple-yellow tracksuit, soccer ball under one arm. Energetic confident pose.

HEIGHT RELATIONSHIPS: Sol, Mia, Leo, and Zoe are roughly the same height. Ben is noticeably shorter — the youngest and smallest in the group.

SETTING: ${setting}

TITLE TEXT: Display the text "${displayTitle}" prominently at the top or center-top of the image in a large, clear, child-friendly ${fontLanguage} font. The text should be bold, legible, and naturally integrated into the composition — as if it's the title of a children's book cover. Use a warm color that contrasts well with the background.

COMPOSITION: This is a BOOK COVER. The 5 characters should be arranged as a group in the lower two-thirds of the image, with the magical setting filling the background. The title text occupies the upper portion. Leave clean space around the title for readability.

EXCLUDE / NEGATIVE PROMPT: No realistic, no semi-realistic, no real humans, no photographs. No UI elements, no buttons, no audio icons, no play buttons, no watermarks, no text beyond the story title. No additional characters beyond the 5 described. No floating heads, no disembodied heads, no missing bodies, no missing limbs, no extra limbs, no deformed characters, no distorted faces, no scary imagery, no grotesque elements, no mutated features. All characters must be shown as FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface. No cropped feet, no cut off legs, no floating characters, no half-body compositions, no missing feet, no legs cut off at frame edge. Characters must be FULLY CONTAINED within the frame with generous margin. Characters must look like cartoon dolls, NEVER like real humans.`;

    // Build multi-image content: [Sol variant, Ben, Zoe, Leo, Mia] + text
    const characterRefContent = [sol.url, ...CHARACTER_BASE_REFS].map(url => ({
      type: "image_url",
      image_url: { url },
    }));

    const requestBody = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: [
          ...characterRefContent,
          { type: "text", text: coverPrompt },
        ],
      }],
    };

    let imageUrl: string | null = null;
    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`Gemini cover attempt ${attempt}/${MAX_ATTEMPTS}...`);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(120_000),
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          console.error(`Cover attempt ${attempt} failed:`, response.status);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
          return new Response(JSON.stringify({ error: "Cover generation failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await response.json();
        imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

        if (imageUrl) break;
        console.warn(`Cover attempt ${attempt}: no image in response`);
        if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
      } catch (fetchErr) {
        console.error(`Cover attempt ${attempt} error:`, fetchErr);
        if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No cover image generated after retries" }), {
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

    const filePath = `${storyId}/cover.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Cover upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Cover upload failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("story-illustrations")
      .getPublicUrl(filePath);

    const fullCoverUrl = publicUrlData.publicUrl;

    await supabase
      .from("stories")
      .update({ cover_url: fullCoverUrl })
      .eq("id", storyId);

    console.log(`✅ Cover generated and saved for story ${storyId}: ${fullCoverUrl}`);

    return new Response(
      JSON.stringify({ success: true, coverUrl: fullCoverUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-cover error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});