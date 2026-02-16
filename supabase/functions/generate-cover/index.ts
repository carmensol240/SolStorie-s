import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const setting = getSettingForTopic(topic || "");
    const isHebrew = language === "he" || !language;
    const fontLanguage = isHebrew ? "Hebrew" : "English";
    // For Hebrew stories, always use the Hebrew title; never fall back to English topic ID
    const displayTitle = isHebrew 
      ? (title && !/^[a-z\-]+$/.test(title) ? title : "סיפור קסום")
      : (title || topic || "A Magical Story");

    const coverPrompt = `In the style of modern 3D Disney-Pixar animation, 8K resolution, soft cinematic lighting, vibrant harmonious colors. Portrait orientation (9:16 aspect ratio).

CHARACTERS (all 5 must appear together in the scene, posing as a group of friends):
1. Sol - a girl about 4 years old, warm tan skin, large expressive brown eyes, long wavy dark brown hair (NOT blonde) tied in a high ponytail with a bright pink hair band. Wearing a bright sunny yellow dress. She stands slightly to the side with a warm smile.
2. Mia - a girl about 4 years old, wearing an emerald green dress, smooth brown bob cut hair, with a small flower crown on her head. She has a gentle, curious expression.
3. Leo - a boy about 4 years old, straight black hair, round glasses, wearing denim overalls over a red-and-yellow striped shirt. He is holding a large rainbow-colored pencil. He has a thoughtful, friendly smile.
4. Ben - a small curly-haired toddler about 3 years old, dark brown curly hair (NOT blonde), warm tan skin similar to Sol (they look like siblings). He stands in the center/front of the group, the smallest of all. Wearing a light green or sky blue shirt.
5. Zoe - a girl about 4 years old with dark brown skin, voluminous afro hair with a light blue headband between her forehead and curls. Wearing a purple-and-yellow tracksuit. She is holding a soccer ball under one arm. She has an energetic, confident pose.

HEIGHT RELATIONSHIPS: Sol, Mia, Leo, and Zoe are roughly the same height. Ben is noticeably shorter — the youngest and smallest in the group.

SETTING: ${setting}

TITLE TEXT: Display the text "${displayTitle}" prominently at the top or center-top of the image in a large, clear, child-friendly ${fontLanguage} font. The text should be bold, legible, and naturally integrated into the composition — as if it's the title of a children's book cover. Use a warm color that contrasts well with the background.

COMPOSITION: This is a BOOK COVER. The 5 characters should be arranged as a group in the lower two-thirds of the image, with the magical setting filling the background. The title text occupies the upper portion. Leave clean space around the title for readability.

EXCLUDE / NEGATIVE PROMPT: No UI elements, no buttons, no audio icons, no play buttons, no watermarks, no text beyond the story title. No additional characters beyond the 5 described. No floating heads, no disembodied heads, no missing bodies, no missing limbs, no extra limbs, no deformed characters, no distorted faces, no scary imagery, no grotesque elements, no mutated features. All characters must be shown as FULL BODY from head to toe.`;

    const requestBody = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: coverPrompt,
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
      console.error("Cover generation failed:", response.status);
      const errText = await response.text();
      console.error("Error body:", errText);
      return new Response(JSON.stringify({ error: "Cover generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response");
      return new Response(JSON.stringify({ error: "No cover image generated" }), {
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

    // Build the full public URL for the cover
    const { data: publicUrlData } = supabase.storage
      .from("story-illustrations")
      .getPublicUrl(filePath);

    const fullCoverUrl = publicUrlData.publicUrl;

    // Update story cover_url with the FULL public URL
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
