import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Identical style block used in generate-illustrations ──
const PIXAR_STYLE = `Pixar 3D CGI animation style, big expressive cartoon eyes with sparkling highlights, soft rounded cute features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book, high quality render, Disney-Pixar aesthetic. NOT realistic. Full body from head to toe, feet VISIBLE and GROUNDED on the surface.`;

const NEGATIVE_PROMPT = `realistic, photograph, semi-realistic, dark, muted, bokeh, hyper-realistic, floating head, missing body, extra limbs, cropped feet, text, watermark, UI elements, multiple characters, group shot`;

const CAST_NEGATIVE_PROMPT = `realistic, semi-realistic, real human, photograph, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field, floating head, missing body, missing limbs, extra limbs, deformed, distorted, scary, horror, mutated, cropped feet, cut off legs, floating character, half-body, missing feet, text, watermark, UI elements`;

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
  // Sol - Heroes
  "superheroes": "Rooftop of a tall building at sunset, hero cape fluttering in the wind, city skyline glowing below",
  "body-safety": "Bright cheerful room with colorful safety posters and a large friendly shield emblem",
  "road-safety": "Sunny crosswalk scene with traffic lights, zebra crossing, and green trees lining the road",
  "environment": "Lush green meadow with crystal-clear river, recycling bins, blooming wildflowers, and a rainbow",
  "we-are-special": "Magical mirror room reflecting colorful unique patterns, sparkling self-portraits on walls",
  "just-be-me": "Whimsical art studio with splattered paint, colorful canvases, and a rainbow window",
  "helping-others": "Sunny neighborhood park with friends sharing toys, a lemonade stand, and kites in the sky",
  "stranger-danger": "Safe cozy home entrance with a warm glowing doorway, friendly neighborhood visible outside",
  "seatbelt-safety": "Inside a colorful cartoon car with sparkly seatbelts, fluffy clouds visible through windows",
  "blood-test": "Friendly pastel-colored doctor's office with rainbow stickers, teddy bears, and a smiling nurse",
  "we-are-superheroes": "Rooftop of a tall building at sunset, hero cape fluttering, city skyline glowing below",

  // Mia - Growing Up
  "body-hero-teeth": "Sparkling crystal cave with toothbrush-shaped crystals and rainbow waterfalls",
  "body-hero-bath": "Magical underwater bubble kingdom with rainbow soap bubbles and friendly rubber ducks",
  "body-hero-hands": "Sparkling fountain garden with rainbow water streams and glowing soap bubbles",
  "body-hero-nails": "Colorful fairy workshop with tiny magical tools and sparkling gem stones",
  "helping-at-home": "Cozy magical kitchen with floating dishes, sparkling sponges, and a happy apron",
  "home-of-love": "Warm living room with glowing heart-shaped cushions, family photos on walls, fairy lights",
  "playing-together": "Sunny enchanted garden with oversized flowers, a magical sandbox, and rainbow sprinklers",
  "potty-training": "Colorful garden kingdom with stepping stones, blooming flowers, and a golden path",
  "pacifier-fairy": "Fairy tale garden with tiny fairy houses, glowing pixie dust trails, and a magical tree",
  "first-day-kindergarten": "Cheerful enchanted schoolhouse with colorful doors, flying books, and a magical welcome arch",
  "mom-dont-go": "Cozy kindergarten entrance with warm sunlight, a magical pocket glowing with love",
  "fear-of-dark": "Enchanted night garden with friendly fireflies, soft glowing lanterns, and a protective moon",
  "friendship-courage": "Whimsical treehouse village in an enchanted forest with glowing mushrooms and fairy lights",
  "sharing": "Sunny playground with a magical sharing table, colorful toys, and happy rainbow overhead",
  "apologize": "Peaceful garden with two benches under a heart-shaped tree, soft golden light",
  "trying-again": "Obstacle course playground with colorful hurdles, a finish-line ribbon, and cheering stars",
  "independence": "Bright room with a small step-stool, an open door to a sunny garden, and a proud mirror",
  "anger-cloud": "Stormy sky transforming into a rainbow, with fluffy clouds and calming rain turning to sunshine",
  "brave-taster": "Magical kitchen with flying vegetables, a sparkly plate, and a chef's hat with stars",
  "clean-room": "Magical toy workshop with floating toys, spinning gears, and sparkling dust",
  "new-house": "Charming new cottage with a moving truck, boxes with stars, and a welcoming front door",
  "dentist-visit": "Friendly cloud hospital with rainbow bridges and smiling star decorations",
  "barber-visit": "Cheerful magical barbershop with sparkly scissors, colorful chairs, and a fun mirror",
  "lost-tooth": "Magical pillow landscape with a tiny tooth fairy castle, glowing coins, and sparkles",
  "new-sibling": "Cozy magical nursery with floating stars, soft glowing clouds, and a rainbow mobile",
  "bedtime-story": "Dreamy cloud kingdom with a glowing crescent moon, floating golden stars, and soft purple sky",
  "pocket-kiss": "Cozy kindergarten gate with a glowing heart in a tiny pocket, warm morning sunlight",
  "sibling-love": "Cozy pillow fort with fairy lights, two sleeping bags, and stars projected on the ceiling",
  "my-special-family": "Warm family living room with diverse family photos, a glowing heart centerpiece",
  "find-a-friend": "Sunny park with a magical friendship tree, colorful swings, and butterflies",
  "screen-time": "Cozy room with a tablet on a shelf, an open window to a sunny playground outside",
  "divorce": "Two cozy colorful houses connected by a rainbow bridge, hearts floating above both",
  "sick-grandparent": "Warm hospital room with colorful get-well balloons, flowers, and a cozy blanket",
  "making-mistakes": "Art studio with a paint-splattered canvas turning into a beautiful painting, sparkles",
  "crying-is-ok": "Soft rainy scene with a rainbow emerging, gentle clouds, and warm sunlight breaking through",
  "nail-trimming": "Colorful fairy workshop with tiny sparkly tools and gemstone decorations",
  "hand-washing": "Sparkling fountain with rainbow water streams and magical soap bubbles floating around",

  // Leo - Imagination
  "zoo-adventure": "Magical jungle clearing with friendly glowing animals, oversized tropical flowers, and fireflies",
  "cloud-adventure": "Fluffy cloud kingdom with rainbow staircases, floating castles, and golden sunshine",
  "magic-kingdom": "Enchanted castle with glowing fairy dust, a sparkling rainbow bridge, and magical turrets",
  "rain-party": "Joyful rainy street with colorful umbrellas, splashing puddles, and a hidden rainbow",
  "underwater": "Vibrant coral reef with friendly fish, glowing jellyfish, and a sunken treasure chest",
  "magical-forest": "Enchanted forest with giant glowing mushrooms, crystal streams, and fairy lanterns",
  "space-adventure": "Cosmic space station floating among glowing stars, colorful planets, and shimmering nebulae",
  "magic-keys": "Ancient magical door covered in glowing runes, with golden keys floating in sparkly air",

  // Zoe - Adventure
  "family-trip": "Magical landscape with rolling green hills, a winding rainbow road, and floating hot air balloons",
  "birthday-party": "Enchanted celebration hall with floating balloons, magical confetti, and a glowing cake",
  "grandparents-night": "Cozy grandparents' living room with warm fireplace, knitted blankets, and cookie jars",
  "flying-vacation": "Inside a colorful airplane cabin with fluffy cloud views, suitcases with stickers",

  // Values & Education
  "patience": "Peaceful zen garden with stepping stones, a slowly blooming flower, and gentle waterfall",
  "politeness": "Elegant tea party setting with tiny cups, polite animal guests, and flower arrangements",
  "self-confidence": "Majestic mountaintop with golden sunrise, soaring eagles, and a heroic flag",
  "play-rules": "Colorful board game world with oversized dice, game pieces, and a fair-play trophy",
  "emotion-regulation": "Calm meditation garden with breathing bubbles, gentle wind chimes, and soft clouds",
  "waiting-in-line": "Cheerful ice-cream shop with a colorful queue, numbered tickets, and happy faces",
  "road-safety": "Sunny crosswalk with bright traffic lights, a friendly crossing guard, and green trees",
  "how-body-works": "Inside a magical body — cartoon organs, flowing rivers of energy, and sparkly cells",
  "nature-secrets": "Enchanted forest glade with magnifying glass revealing tiny insects, dewdrops, and fungi",
  "space-journey": "Deep space with a rocket ship, swirling galaxies, colorful planets, and shooting stars",
  "cloud-kingdom": "Majestic cloud palace with cotton-candy towers, rainbow bridges, and golden sunbeams",
  "dragon-party": "Festive dragon cave with friendly colorful dragons, party hats, and a treasure-pile cake",
  "strange-inventions": "Wacky inventor's lab with bubbling potions, spinning gears, and crazy flying machines",
  "accepting-differences": "Rainbow garden where every flower is unique, colorful butterflies, inclusive playground",
  "true-friendship": "Enchanted treehouse with a friendship bracelet workshop, fairy lights, and warm glow",
  "helping-home": "Cozy magical kitchen with floating dishes, sparkling sponges, and a happy apron",
  "safe-room-sirens": "Cozy safe room with soft cushions, glowing stars on the ceiling, and a calm nightlight",

  // Legacy/alternate IDs
  "teeth-brushing": "Sparkling crystal cave with toothbrush-shaped crystals and rainbow waterfalls",
  "bedtime": "Dreamy cloud kingdom with a glowing crescent moon, floating golden stars, and soft purple sky",
  "friendship": "Whimsical treehouse village in an enchanted forest with glowing mushrooms and fairy lights",
  "bath-shower": "Magical underwater bubble kingdom with rainbow soap bubbles and friendly rubber ducks",
  "bathtime": "Magical bubble kingdom with rainbow soap bubbles and friendly rubber ducks",
  "birthday": "Enchanted celebration hall with floating balloons, magical confetti, and a glowing cake",
  "pacifier": "Fairy tale garden with tiny fairy houses and glowing pixie dust trails",
  "magic-castle": "Grand enchanted castle with glowing towers, a drawbridge, and magical fireworks",
  "kingdom": "Majestic fairy-tale kingdom with golden spires, floating banners, and enchanted gardens",
  "space": "Cosmic scene with rocket ships, swirling galaxies, and colorful planets",
  "space-hero": "Heroic space station cockpit with glowing controls, stars visible through the viewport",
  "zoo": "Magical jungle clearing with friendly glowing animals and oversized tropical flowers",
  "toothbrush": "Sparkling bathroom castle with giant friendly toothbrush guards and minty waterfalls",
  "fears": "Enchanted night garden with friendly fireflies, soft glowing lanterns, and a protective moon",
  "friends": "Sunny magical playground with rainbow slides and floating balloons",
  "kindergarten": "Cheerful enchanted schoolhouse with colorful doors, flying books, and a magical welcome arch",
  "siblings": "Cozy magical nursery with floating stars and a glowing heart-shaped mobile",
  "confidence": "Majestic mountaintop with golden sunrise, soaring eagles, and a heroic flag",
  "nature": "Enchanted forest glade with crystal streams, giant flowers, and butterflies made of light",
  "educational-toolbox": "Colorful classroom with magical floating books, glowing alphabet blocks, and a chalkboard",
  "sharing-fun": "Sunny playground with a magical sharing table, colorful toys, and a happy rainbow",
  "honesty": "Crystal-clear lake reflecting truth, with a shining lighthouse and open books",
  "cooperation": "Group puzzle landscape where pieces float together to form a beautiful picture",
  "respecting-elders": "Warm grandparents' garden with a storytelling bench, tea set, and blooming roses",
};

function getSettingForTopic(topic: string): string {
  return TOPIC_SETTINGS[topic] || "Enchanted forest clearing with magical glowing light, sparkling fireflies, and a majestic ancient tree";
}

// ── Shared helper: upload base64 image to storage and update story ──
async function uploadCoverAndSave(
  supabase: ReturnType<typeof createClient>,
  storyId: string,
  base64Image: string,
): Promise<Response> {
  const base64Content = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

  const filePath = `${storyId}/cover-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("story-illustrations")
    .upload(filePath, bytes, { contentType: "image/png", upsert: true });

  if (uploadError) {
    console.error("Cover upload error:", uploadError);
    return new Response(JSON.stringify({ error: "Cover upload failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: publicUrlData } = supabase.storage.from("story-illustrations").getPublicUrl(filePath);
  const fullCoverUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.from("stories").update({ cover_url: fullCoverUrl }).eq("id", storyId);
  if (updateError) {
    console.error("❌ Cover DB update failed:", updateError);
    const { error: retryError } = await supabase.from("stories").update({ cover_url: fullCoverUrl }).eq("id", storyId);
    if (retryError) {
      console.error("❌ Cover DB update retry failed:", retryError);
      return new Response(JSON.stringify({ error: "Cover saved to storage but DB update failed", coverUrl: fullCoverUrl }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const { data: verify } = await supabase.from("stories").select("cover_url").eq("id", storyId).maybeSingle();
  console.log(`✅ Cover saved for story ${storyId}: ${fullCoverUrl} (verified: ${verify?.cover_url ? 'yes' : 'NO'})`);

  return new Response(JSON.stringify({ success: true, coverUrl: fullCoverUrl }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Shared helper: call Gemini image generation with retries ──
async function callGeminiImage(
  apiKey: string,
  requestBody: Record<string, unknown>,
  maxAttempts = 2,
  label = "cover",
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini ${label} attempt ${attempt}/${maxAttempts}...`);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`${label} attempt ${attempt} failed: ${response.status}`);
        if (attempt < maxAttempts) { await new Promise(r => setTimeout(r, 3000)); continue; }
        return null;
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      if (imageUrl) return imageUrl;

      console.warn(`${label} attempt ${attempt}: no image in response`);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`${label} attempt ${attempt} error:`, err);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return null;
}

// ── Extract character profile from photo (identical to generate-illustrations) ──
async function extractCharacterProfile(
  childPhoto: string,
  childGender: string,
  ageRange: string,
  apiKey: string,
): Promise<{ hairDescription: string; clothingDescription: string; skinTone: string; eyeColor: string }> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `CRITICAL: Analyze this child's photo and extract detailed visual features for character consistency across a storybook.
Return ONLY a JSON object with these exact fields:
{
  "hair_color": "specific color (e.g., dark brown, light blonde, black, auburn)",
  "hair_style": "specific style (e.g., short curly, long straight with bangs, pigtails, buzz cut)",
  "clothing_color": "primary clothing color",
  "clothing_type": "type of clothing (e.g., red t-shirt, blue dress, green sweater)",
  "skin_tone": "skin tone description (e.g., fair, medium, olive, dark)",
  "eye_color": "eye color if visible (e.g., brown, blue, green)"
}
Be very specific and detailed. This profile will be used to ensure the character looks IDENTICAL in every illustration.
Return only the JSON, no other text.`,
            },
            { type: "image_url", image_url: { url: childPhoto } },
          ],
        }],
      }),
    });

    if (!response.ok) {
      console.error("Profile extraction failed for cover, using defaults");
      return getDefaultCoverProfile(childGender);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const profile = JSON.parse(cleanedContent);

    return {
      hairDescription: `${profile.hair_color || "brown"} ${profile.hair_style || "hair"}`,
      clothingDescription: `${profile.clothing_color || "colorful"} ${profile.clothing_type || "clothes"}`,
      skinTone: profile.skin_tone || "medium",
      eyeColor: profile.eye_color || "brown",
    };
  } catch {
    console.log("Could not parse cover profile, using defaults");
    return getDefaultCoverProfile(childGender);
  }
}

function getDefaultCoverProfile(childGender: string) {
  const isFemale = childGender === "female";
  return {
    hairDescription: isFemale ? "long dark brown hair styled in a high bun with a pink hair band" : "short tousled dark brown hair",
    clothingDescription: isFemale
      ? "a superhero costume — red cape, light blue shirt with a golden star emblem on the chest, purple pants, and white sneakers"
      : "colorful casual clothes",
    skinTone: "warm medium olive",
    eyeColor: isFemale ? "large warm brown" : "large dark brown",
  };
}

// ── Build the personalized cover prompt — uses IDENTICAL style as illustrations ──
function buildPersonalizedPrompt(
  avatarDescription: string | null,
  setting: string,
  characterProfile: { hairDescription: string; clothingDescription: string; skinTone: string; eyeColor: string } | null,
  storyContext: string,
): string {
  const profileBlock = characterProfile
    ? `Character has ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, and ${characterProfile.eyeColor} eyes.`
    : "";

  const traitBlock = avatarDescription
    ? `Character traits from profile: ${avatarDescription}. ${profileBlock} Render these features EXACTLY in Pixar 3D CGI style.`
    : `${profileBlock} Render the child's face, hair color, hair texture, skin tone, eye color, and ALL facial features EXACTLY as shown in the reference photo, in Pixar 3D CGI style.`;

  return `FACE REFERENCE: The main character's face MUST be an EXACT 3D Pixar rendering of the child in the reference photo. Keep all facial features, hair color, hair texture, and skin tone identical.

${traitBlock}

STYLE: ${PIXAR_STYLE}

The ONLY character in this cover is the child from the reference photo. They should be shown as a confident, happy hero standing in the CENTER of the scene. FULL BODY from head to toe, feet GROUNDED on the surface.

SCENE: ${storyContext} Setting: ${setting}. The child is the central hero of this magical scene, looking confident and adventurous.

COMPOSITION: This is a children's book cover illustration. The child hero should be the central and largest figure. The magical setting fills the background. Clean, simple, impactful. Do NOT render any text or title on the image.

NEGATIVE: ${NEGATIVE_PROMPT}`;
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
      .select("child_name, user_id, child_gender, age_range, summary")
      .eq("id", storyId)
      .maybeSingle();

    // Fetch ALL page illustration_prompts for richer scene context
    const { data: allPages } = await supabase
      .from("story_pages")
      .select("illustration_prompt, text, page_number")
      .eq("story_id", storyId)
      .order("page_number", { ascending: true });

    // Pick the most descriptive illustration prompt (longest one tends to be richest)
    const bestIllustrationPrompt = allPages
      ?.filter(p => p.illustration_prompt)
      ?.sort((a, b) => (b.illustration_prompt?.length || 0) - (a.illustration_prompt?.length || 0))
      ?.[0]?.illustration_prompt || "";

    const topicLabel = (topic || "").replace(/-/g, " ");
    const storyContext = story?.summary
      ? `A "${topicLabel}" themed story: ${story.summary}`
      : bestIllustrationPrompt
        ? `A "${topicLabel}" themed story. Scene inspiration: ${bestIllustrationPrompt}`
        : allPages?.[0]?.text
          ? `A "${topicLabel}" themed story. Opening: ${allPages[0].text}`
          : title
            ? `A "${topicLabel}" themed story: ${title}`
            : `A "${topicLabel}" themed children's story`;

    // Check if child has a photo for personalized cover
    let childPhotoSignedUrl: string | null = null;
    let avatarDescription: string | null = null;
    if (story?.user_id && story?.child_name) {
      const { data: child } = await supabase
        .from("children")
        .select("avatar_url, photo_url, avatar_description")
        .eq("user_id", story.user_id)
        .eq("name", story.child_name)
        .maybeSingle();

      avatarDescription = child?.avatar_description || null;
      const photoPath = child?.photo_url || child?.avatar_url;
      if (photoPath) {
        if (photoPath.startsWith("http")) {
          childPhotoSignedUrl = photoPath;
          console.log(`🖼️ Child photo (HTTP URL) found — personalizing cover`);
        } else if (photoPath.startsWith("data:")) {
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
              childPhotoSignedUrl = signedData?.signedUrl || null;
              console.log(`✅ Photo uploaded, using signed URL for cover`);
            }
          } catch {
            // Could not convert data URI
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

    // ═══════════════════════════════════════════════════════════
    // PATH A: Child photo exists → single-reference personalized cover
    // ═══════════════════════════════════════════════════════════
    if (childPhotoSignedUrl) {
      const childGender = story?.child_gender || "female";
      const ageRange = story?.age_range || "3-6";
      console.log(`Extracting character profile for cover (gender: ${childGender}, age: ${ageRange})`);
      const characterProfile = await extractCharacterProfile(childPhotoSignedUrl, childGender, ageRange, LOVABLE_API_KEY);
      console.log(`Character profile extracted: hair=${characterProfile.hairDescription}, skin=${characterProfile.skinTone}`);

      const coverPrompt = buildPersonalizedPrompt(avatarDescription, setting, characterProfile, storyContext);

      const requestBody = {
        model: "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: childPhotoSignedUrl } },
            { type: "text", text: coverPrompt },
          ],
        }],
      };

      const imageUrl = await callGeminiImage(LOVABLE_API_KEY, requestBody, 3, "personalized cover");

      if (imageUrl) {
        console.log(`✅ Personalized cover generated for story ${storyId}`);
        return uploadCoverAndSave(supabase, storyId, imageUrl);
      }

      console.error(`❌ All personalized cover attempts failed for story ${storyId}`);
      return new Response(JSON.stringify({ error: "Personalized cover generation failed after retries" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // PATH B: No child photo → cast-based cover (Sol + friends)
    // Uses the same Pixar 3D CGI style directive
    // ═══════════════════════════════════════════════════════════
    const sol = getSolUrl(topic || "");
    console.log(`No child photo — using cast cover. Sol variant: ${sol.label}`);

    const solDescription = sol.label === "Sol hero"
      ? "Sol in her adventure/fantasy outfit — match EXACTLY from the provided reference image"
      : "Sol in her superhero costume — warm tan skin, long dark brown hair in a high bun with pink band, red cape, light blue shirt with a golden star emblem, purple pants, white sneakers — match EXACTLY from the provided reference image";

    const castCoverPrompt = `STYLE: ${PIXAR_STYLE}

Characters must look like adorable cartoon dolls — NOT realistic humans. Portrait orientation (9:16 aspect ratio).

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

SCENE: ${storyContext} Setting: ${setting}

COMPOSITION: This is a children's book cover illustration. The 5 characters should be arranged as a group in the lower two-thirds of the image, with the magical setting filling the background. Leave clean space at the top. Do NOT render any text or title on the image.

NEGATIVE: ${CAST_NEGATIVE_PROMPT}`;

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
          { type: "text", text: castCoverPrompt },
        ],
      }],
    };

    const imageUrl = await callGeminiImage(LOVABLE_API_KEY, requestBody, 2, "cast cover");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No cover image generated after retries" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return uploadCoverAndSave(supabase, storyId, imageUrl);
  } catch (error) {
    console.error("generate-cover error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
