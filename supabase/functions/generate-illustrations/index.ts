import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Adventure/fantasy topics where Sol Hero is used instead of Sol Casual
const ADVENTURE_TOPICS = new Set([
  "space-adventure", "magic-kingdom", "zoo-adventure", "cloud-adventure",
  "magic-castle", "magic-keys", "magical-forest", "space-hero", "kingdom",
  "underwater", "superheroes", "fantasy", "adventure", "dragon", "princess",
  "pirate", "fairy", "wizard",
]);

const SOL_CASUAL_URL = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20casual.png";
const SOL_HERO_URL   = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/sol%20hero.png";
const MOM_CARMEN_URL = "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/mom-carmen.jpeg";
const CHARACTER_BASE_REFS = [
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/ben.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/zoe.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/leo.jpeg",
  "https://xqoxoxxlyfimlbekfjxo.supabase.co/storage/v1/object/public/character-assets/mia.jpeg",
  MOM_CARMEN_URL,
];

function buildCharacterRefs(topic: string) {
  const isAdventure = ADVENTURE_TOPICS.has(topic);
  const solUrl = isAdventure ? SOL_HERO_URL : SOL_CASUAL_URL;
  const solLabel = isAdventure ? "Sol hero" : "Sol casual";
  console.log(`Sol variant selected: ${solLabel} for topic "${topic}"`);
  return {
    urls: [solUrl, ...CHARACTER_BASE_REFS],
    solLabel,
    isAdventure,
  };
}

// Character Profile interface for consistency across illustrations
interface CharacterProfile {
  gender: string;
  genderHebrew: string;
  hairDescription: string;
  clothingDescription: string;
  ageDescription: string;
  skinTone: string;
  eyeColor: string;
}

// Helper function to extract character profile from photo using AI
async function extractCharacterProfile(
  childPhoto: string,
  childGender: string,
  ageRange: string,
  apiKey: string
): Promise<CharacterProfile> {
  try {
    const genderHebrew = childGender === "female" ? "ילדה" : "ילד";
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
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
Return only the JSON, no other text.`
              },
              { type: "image_url", image_url: { url: childPhoto } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Profile extraction failed, using defaults");
      return getDefaultProfile(childGender, genderHebrew, ageRange);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const profile = JSON.parse(cleanedContent);
      
      return {
        gender: childGender,
        genderHebrew: genderHebrew,
        hairDescription: `${profile.hair_color || "brown"} ${profile.hair_style || "hair"}`,
        clothingDescription: `${profile.clothing_color || "colorful"} ${profile.clothing_type || "clothes"}`,
        ageDescription: ageRange,
        skinTone: profile.skin_tone || "medium",
        eyeColor: profile.eye_color || "brown",
      };
    } catch {
      console.log("Could not parse profile, using defaults");
      return getDefaultProfile(childGender, genderHebrew, ageRange);
    }
  } catch (error) {
    console.error("Error extracting character profile:", error);
    return getDefaultProfile(childGender, genderHebrew, ageRange);
  }
}

function getDefaultProfile(childGender: string, genderHebrew: string, ageRange: string): CharacterProfile {
  // Default profiles based on gender for visual anchoring when no photo is provided
  // Female default is modeled after Sol: 4yo, long straight brown hair in high ponytail, brown eyes, bright yellow dress
  const isFemale = childGender === "female";
  return {
    gender: childGender,
    genderHebrew: genderHebrew,
    hairDescription: isFemale ? "long straight to slightly wavy brown hair in a high ponytail" : "short tousled dark brown hair",
    clothingDescription: isFemale ? "a bright yellow dress" : "colorful casual clothes",
    ageDescription: ageRange || (isFemale ? "4" : "3-6"),
    skinTone: "warm medium olive",
    eyeColor: isFemale ? "large warm brown" : "large dark brown",
  };
}

// Generate a single-paragraph "Visual Anchor" text that will be prepended to EVERY illustration prompt
// This ensures the AI has a consistent mental image of the character across all pages
function buildVisualAnchor(profile: CharacterProfile, storyOutfit: string): string {
  const genderWord = profile.gender === "female" ? "girl" : "boy";
  return `VISUAL ANCHOR (use this EXACT description for the main character in EVERY illustration):
A ${genderWord} aged ${profile.ageDescription} with ${profile.hairDescription}, ${profile.skinTone} skin, and ${profile.eyeColor} eyes. Wearing ${storyOutfit}. 
CRITICAL INSTRUCTION: Maintain strict visual character continuity across ALL generated images for this story sequence. The character must look like the SAME child in every single illustration — same face shape, same proportions, same hair, same outfit, same skin tone. Any visual deviation between pages is a FAILURE.`;
}

// Helper: generate illustration with face reference via Fal.ai Instant Character
// Maintains character likeness from a single reference photo with high consistency
async function generateIllustrationWithFace(
  prompt: string,
  childPhotoUrl: string,
  characterProfile: CharacterProfile | null,
  storyOutfit: string,
  visualAnchor: string,
  adventureLogic?: { outfit: string; background: string; theme: string },
): Promise<string | null> {
  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY not configured for Instant Character");
      return null;
    }

    const finalOutfit = storyOutfit || adventureLogic?.outfit || characterProfile?.clothingDescription || "colorful casual clothes";

    const castDescription = `Secondary characters (keep them smaller/background, do NOT let them overshadow the main character):
- Ben: toddler boy with very curly dark hair, warm tan skin, light green shirt — SMALLEST character, 3D Disney Pixar style
- Zoe: dark-skinned girl with voluminous black curls, light blue headband, purple-yellow athletic tracksuit, athletic build — 3D Disney Pixar style
- Leo: boy with straight black hair, round glasses, denim overalls — 3D Disney Pixar style
- Mia: girl with smooth brown bob, small flower crown, emerald green dress — 3D Disney Pixar style`;

    const adventureInstruction = adventureLogic
      ? `Setting: ${adventureLogic.background}. Theme: ${adventureLogic.theme}.`
      : "";

    const fullPrompt = `CRITICAL FACE REFERENCE: The main character's face, hair texture, skin tone, and facial features MUST be an EXACT 3D Pixar rendering of the person in the reference photo. Do NOT invent or change any facial features — derive ALL appearance strictly from the photo.

3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. Big round expressive cartoon eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin with NO pores or texture. Exaggerated cute proportions with large heads, small noses, and expressive faces. Vibrant rich saturated colors, warm magical golden lighting. Colorful detailed backgrounds with magical fantasy elements (glowing mushrooms, fireflies, sparkles, enchanted forests). Clean sharp 3D rendering, rich textures, playful and whimsical atmosphere. ALWAYS show characters FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface. Frame the character with generous margin from all edges. DO NOT render flat, photorealistic, semi-realistic, dark, muted, cinematic bokeh, or hyper-realistic styles. Characters must NEVER look like real humans or photographs — always stylized 3D cartoon dolls.

MAIN CHARACTER: The child from the reference photo is the HERO. They wear ${finalOutfit}. They must be the LARGEST and most PROMINENT figure. ${adventureInstruction}

CRITICAL CHARACTER CONSISTENCY: The main character must look IDENTICAL in every illustration — same face shape, same hair color and style, same clothing colors, same skin tone, same eye color. Any visual deviation between pages is a FAILURE.
...
FULL BODY head to toe, feet GROUNDED on surface. Portrait 4:3 framing. NEGATIVE: realistic, semi-realistic, real human, photograph, generic face, wrong hair, floating head, missing body, extra limbs, deformed, cropped feet, text, watermark, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field`;

    console.log("Generating illustration via Fal.ai Instant Character (face reference)...");

    const response = await fetch("https://fal.run/fal-ai/instant-character", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_url: childPhotoUrl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "no body");
      console.error(`Instant Character generation failed: ${response.status} - ${errorBody}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (imageUrl) {
      console.log("Instant Character illustration generated successfully");
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        console.error("Failed to download Instant Character image");
        return null;
      }
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
      return `data:image/png;base64,${btoa(chunks.join(''))}`;
    }

    return null;
  } catch (error) {
    console.error("Error in Instant Character illustration:", error);
    return null;
  }
}

// Helper function to generate illustration using Fal.ai Flux Schnell
// Fast (~2-4s per image) text-to-image model — used when NO child photo is available
async function generateIllustration(
  prompt: string,
  childPhoto: string | null,
  characterProfile: CharacterProfile | null,
  apiKey: string,
  storyOutfit: string,
  visualAnchor: string,
  adventureLogic?: { outfit: string; background: string; theme: string },
  topic?: string
): Promise<string | null> {
  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY is not configured, cannot generate illustration");
      return null;
    }

    const finalOutfit = storyOutfit || adventureLogic?.outfit || characterProfile?.clothingDescription || "colorful casual clothes";

    const characterInstruction = characterProfile
      ? `The main character is a ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, and ${characterProfile.eyeColor} eyes. Wearing ${finalOutfit}. This character must look IDENTICAL in every illustration — same face, hair, outfit, proportions.`
      : "";

    const adventureInstruction = adventureLogic
      ? `Setting: ${adventureLogic.background}. Theme: ${adventureLogic.theme}.`
      : "";

    const stylePrefix = `3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'. Characters must look like adorable cartoon dolls — NOT realistic humans. Big round expressive cartoon eyes with sparkling highlights, soft rounded cute faces, smooth stylized skin with NO pores or texture. Exaggerated cute proportions with large heads, small noses, and expressive faces. Vibrant rich saturated colors, warm magical golden lighting. Colorful detailed backgrounds with magical fantasy elements (glowing mushrooms, fireflies, sparkles, enchanted forests). Clean sharp 3D rendering, rich textures, playful and whimsical atmosphere. ALWAYS show characters FULL BODY from head to toe with feet VISIBLE and GROUNDED on the surface. Frame the character with generous margin from all edges. DO NOT render flat, photorealistic, semi-realistic, dark, muted, cinematic bokeh, or hyper-realistic styles. Characters must NEVER look like real humans or photographs — always stylized 3D cartoon dolls.`;

    const negativePrompt = `realistic, semi-realistic, real human, photograph, photorealistic, dark, muted colors, cinematic bokeh, hyper-realistic, shallow depth of field, floating head, missing body, missing limbs, extra limbs, deformed, distorted, scary, horror, mutated, cropped feet, cut off legs, floating character, half-body, missing feet, text, watermark, UI elements`;

    const fullPrompt = `${stylePrefix}\n\n${visualAnchor}\n\n${characterInstruction}\n${adventureInstruction}\n\nSCENE: ${prompt}\n\nNEGATIVE: ${negativePrompt}`;

    console.log("Generating illustration via Fal.ai Flux Schnell (no photo, text-only fallback)...");

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
      console.error(`Fal.ai image generation failed: ${response.status} - ${errorBody}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.images?.[0]?.url;

    if (imageUrl) {
      console.log("Illustration generated successfully via Fal.ai Schnell");
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) {
        console.error("Failed to download generated image from Fal.ai");
        return null;
      }
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
      return `data:image/png;base64,${btoa(chunks.join(''))}`;
    }

    return null;
  } catch (error) {
    console.error("Error generating illustration:", error);
    return null;
  }
}

// Helper function to upload base64 image to Supabase Storage
// Returns the storage PATH (not URL) for private bucket access via signed URLs
async function uploadImageToStorage(
  supabase: any,
  base64Data: string,
  storyId: string,
  pageNumber: number
): Promise<string | null> {
  try {
    const base64Content = base64Data.includes(",") 
      ? base64Data.split(",")[1] 
      : base64Data;
    
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${storyId}/page-${pageNumber}.png`;
    
    const { data, error } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Return the storage PATH (not public URL) since bucket is private
    // Frontend will use SignedImage component to get signed URLs
    console.log("Image uploaded successfully, path:", filePath);
    return filePath;
  } catch (error) {
    console.error("Error in uploadImageToStorage:", error);
    return null;
  }
}

// Theme-based outfit mapping for dynamic character clothing
const THEME_OUTFITS: Record<string, { outfit: string; background: string; theme: string }> = {
  "space-adventure": {
    outfit: "silver space suit with transparent helmet",
    background: "cosmic space station with stars and planets",
    theme: "exciting space exploration adventure"
  },
  "bedtime-story": {
    outfit: "cozy pajamas with star patterns",
    background: "warm bedroom with soft moonlight",
    theme: "peaceful nighttime"
  },
  "magic-kingdom": {
    outfit: "royal prince/princess gown with sparkly crown",
    background: "magical castle with glowing towers and fairy dust",
    theme: "enchanted fairy tale adventure"
  },
  "body-hero-bath": {
    outfit: "white fluffy bathrobe with duckie slippers",
    background: "colorful bathroom with rainbow bubbles",
    theme: "fun bath time adventure"
  },
  "body-hero-teeth": {
    outfit: "superhero cape with toothbrush emblem",
    background: "sparkling bathroom with magical mirror",
    theme: "tooth brushing hero adventure"
  },
  "body-hero-hands": {
    outfit: "colorful apron with soap bubble patterns",
    background: "bright kitchen sink with bubbles",
    theme: "hand washing adventure"
  },
  "clean-room": {
    outfit: "comfortable play clothes with tool belt",
    background: "child's bedroom with toys scattered around",
    theme: "organizing adventure"
  },
  "potty-training": {
    outfit: "colorful underwear with crown pattern",
    background: "cheerful bathroom with step stool",
    theme: "growing up adventure"
  },
  "dentist-visit": {
    outfit: "comfortable clothes with brave badge",
    background: "friendly dentist office with colorful decorations",
    theme: "brave dental visit"
  },
  "friendship-courage": {
    outfit: "colorful playground clothes",
    background: "sunny playground with friends",
    theme: "friendship adventure"
  },
  "zoo-adventure": {
    outfit: "safari explorer outfit with binoculars",
    background: "colorful zoo with friendly animals",
    theme: "animal discovery adventure"
  },
  "family-trip": {
    outfit: "comfortable travel clothes with backpack",
    background: "scenic nature landscape",
    theme: "family adventure"
  },
  "safe-room-sirens": {
    outfit: "cozy pajamas or comfortable home clothes",
    background: "a safe room (mamad) with warm blankets, pillows, family together, soft warm light",
    theme: "calming safety and family togetherness during sirens"
  },
};
serve(async (req) => {
  console.log("=== generate-illustrations function called ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called internally by generate-story, so we use service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json();
    const { storyId, childPhoto, childAvatarUrl, childGender, ageRange, adventureLogic, userId, childName, topic, singlePageNumber } = requestBody;
    
    console.log("Request body received:", { 
      storyId, 
      hasChildPhoto: !!childPhoto, 
      hasChildAvatarUrl: !!childAvatarUrl,
      childGender,
      ageRange,
      hasAdventureLogic: !!adventureLogic,
      userId: userId ? userId.substring(0, 8) + "..." : "none",
      childName,
      topic,
      singlePageNumber: singlePageNumber ?? "all"
    });

    if (!storyId) {
      console.error("Missing storyId in request");
      return new Response(
        JSON.stringify({ error: "Missing storyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting illustration generation for story ${storyId}`);

    // Get the story pages
    const { data: pages, error: pagesError } = await supabase
      .from("story_pages")
      .select("*")
      .eq("story_id", storyId)
      .order("page_number", { ascending: true });

    if (pagesError) {
      console.error("Error fetching pages:", pagesError);
      
      // Update story status to failed
      await supabase
        .from("stories")
        .update({ generation_status: "failed" })
        .eq("id", storyId);
      
      return new Response(
        JSON.stringify({ error: "Database error fetching pages" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!pages || pages.length === 0) {
      console.error("No pages found for story:", storyId);
      
      // Update story status to failed
      await supabase
        .from("stories")
        .update({ generation_status: "failed" })
        .eq("id", storyId);
      
      return new Response(
        JSON.stringify({ error: "Story pages not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${pages.length} pages for story ${storyId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      
      // Update story status to failed
      await supabase
        .from("stories")
        .update({ generation_status: "failed" })
        .eq("id", storyId);
        
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("LOVABLE_API_KEY is configured, proceeding with illustration generation...");

    // Use avatar URL if available, otherwise use original photo
    const effectivePhoto = childAvatarUrl || childPhoto;

    // === AVATAR PERSISTENCE LOGIC ===
    // Check if we already have a saved character profile for this child
    let characterProfile: CharacterProfile | null = null;
    let savedProfileFromDb = false;
    
    if (userId && childName) {
      console.log(`Checking for existing avatar profile for ${childName}...`);
      const { data: existingChild } = await supabase
        .from('children')
        .select('avatar_description, avatar_url')
        .eq('user_id', userId)
        .eq('name', childName)
        .maybeSingle();
      
      if (existingChild?.avatar_description) {
        try {
          characterProfile = JSON.parse(existingChild.avatar_description);
          savedProfileFromDb = true;
          console.log(`✅ Reusing saved avatar profile for ${childName}:`, characterProfile);
        } catch (e) {
          console.log("Could not parse saved profile, will generate new one");
        }
      }
    }
    
    // If no saved profile, extract from photo
    if (!characterProfile && effectivePhoto) {
      console.log("Extracting character profile from photo...");
      characterProfile = await extractCharacterProfile(effectivePhoto, childGender || "male", ageRange || "3-6", LOVABLE_API_KEY);
      console.log("Character profile extracted:", characterProfile);
      
      // Save the profile for future stories (only if we have userId and childName)
      if (userId && childName && characterProfile) {
        console.log(`Saving avatar profile for ${childName} for future stories...`);
        const { error: updateError } = await supabase
          .from('children')
          .update({ avatar_description: JSON.stringify(characterProfile) })
          .eq('user_id', userId)
          .eq('name', childName);
        
        if (updateError) {
          console.warn("Could not save avatar profile:", updateError);
        } else {
          console.log("✅ Avatar profile saved for future stories");
        }
      }
    }
    
    // === DYNAMIC OUTFIT BASED ON TOPIC ===
    // Get theme-appropriate outfit while keeping physical features locked
    let effectiveAdventureLogic = adventureLogic;
    if (!effectiveAdventureLogic && topic) {
      effectiveAdventureLogic = THEME_OUTFITS[topic] || null;
      if (effectiveAdventureLogic) {
        console.log(`Using theme outfit for "${topic}":`, effectiveAdventureLogic);
      }
    }

    // === DETERMINE SINGLE OUTFIT FOR ENTIRE STORY ===
    // This outfit will be used for ALL pages to ensure consistency
    const storyOutfit = effectiveAdventureLogic?.outfit || characterProfile?.clothingDescription || "colorful casual clothes";
    console.log(`🎽 Story outfit locked for all pages: "${storyOutfit}"`);

    // === BUILD VISUAL ANCHOR ===
    // A single-paragraph description generated ONCE and injected into EVERY illustration prompt
    const visualAnchor = characterProfile 
      ? buildVisualAnchor(characterProfile, storyOutfit)
      : `VISUAL ANCHOR: A child wearing ${storyOutfit}. Maintain strict visual character continuity across ALL illustrations.`;
    console.log(`🔒 Visual Anchor created for character consistency`);

    // Only generate illustrations for pages that have an illustration_prompt (spread layout)
    let pagesToIllustrate = pages.filter(p => p.illustration_prompt);
    console.log(`${pagesToIllustrate.length} of ${pages.length} pages need illustrations (spread layout)`);

    // If singlePageNumber is specified, only generate for that one page
    if (singlePageNumber !== undefined && singlePageNumber !== null) {
      pagesToIllustrate = pagesToIllustrate.filter(p => p.page_number === singlePageNumber);
      console.log(`Single-page mode: generating only page ${singlePageNumber} (${pagesToIllustrate.length} match)`);
      if (pagesToIllustrate.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: `Page ${singlePageNumber} has no illustration_prompt, skipping` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    let firstIllustrationUrl: string | null = null;

    // Flux Schnell is fast — 1s delay between pages to avoid rate limiting
    console.log(`Generating ${pagesToIllustrate.length} illustrations sequentially via Fal.ai Flux Schnell...`);

    // Resolve HTTP URL for child photo (Instant Character requires HTTP URL, not base64)
    let childPhotoSignedUrl: string | null = null;
    if (effectivePhoto) {
      if (effectivePhoto.startsWith("http")) {
        childPhotoSignedUrl = effectivePhoto;
      } else if (effectivePhoto.startsWith("data:")) {
        // Upload base64 data URI to storage and use the public URL
        // Instant Character works much better with HTTP URLs than raw base64
        console.log(`🖼️ Child photo is a data URI — uploading to storage for HTTP URL...`);
        try {
          const base64Content = effectivePhoto.split(",")[1] || effectivePhoto;
          const binaryString = atob(base64Content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const tempPath = `temp-refs/${userId || 'anon'}/${Date.now()}.png`;
          const { error: uploadErr } = await supabase.storage
            .from("child-photos")
            .upload(tempPath, bytes, { contentType: "image/png", upsert: true });
          if (!uploadErr) {
            const { data: signedData } = await supabase.storage
              .from("child-photos")
              .createSignedUrl(tempPath, 3600);
            childPhotoSignedUrl = signedData?.signedUrl || null;
            console.log(`✅ Photo uploaded to storage, using signed URL for Instant Character`);
          } else {
            console.warn(`Upload failed, falling back to data URI:`, uploadErr);
            childPhotoSignedUrl = effectivePhoto;
          }
        } catch (e) {
          console.warn(`Error uploading data URI, falling back:`, e);
          childPhotoSignedUrl = effectivePhoto;
        }
      } else {
        const { data: signedData } = await supabase.storage
          .from("child-photos")
          .createSignedUrl(effectivePhoto, 3600);
        childPhotoSignedUrl = signedData?.signedUrl || null;
      }
      if (childPhotoSignedUrl) {
        console.log(`🖼️ Child photo available — will use Flux PuLID for face-consistent illustrations`);
      }
    }

    for (const page of pagesToIllustrate) {
      console.log(`Generating illustration for page ${page.page_number}...`);
      
      let base64Image: string | null = null;
      const MAX_RETRIES = 2;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        // Branch: use PuLID when child photo exists, Schnell otherwise
        if (childPhotoSignedUrl) {
          base64Image = await generateIllustrationWithFace(
            page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`,
            childPhotoSignedUrl,
            characterProfile,
            storyOutfit,
            visualAnchor,
            effectiveAdventureLogic,
          );
        } else {
          base64Image = await generateIllustration(
            page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`,
            effectivePhoto,
            characterProfile,
            LOVABLE_API_KEY,
            storyOutfit,
            visualAnchor,
            effectiveAdventureLogic,
            topic
          );
        }
        
        if (base64Image) {
          if (attempt > 1) console.log(`✅ Page ${page.page_number} succeeded on retry ${attempt}`);
          break;
        }
        
        console.warn(`⚠️ Page ${page.page_number} attempt ${attempt}/${MAX_RETRIES} failed, ${attempt < MAX_RETRIES ? 'retrying...' : 'giving up'}`);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!base64Image) {
        console.log(`Page ${page.page_number}: no image`);
        continue;
      }

      const illustrationUrl = await uploadImageToStorage(
        supabase,
        base64Image,
        storyId,
        page.page_number
      );

      if (illustrationUrl) {
        const { error: updateError } = await supabase
          .from("story_pages")
          .update({ illustration_url: illustrationUrl })
          .eq("id", page.id);

        if (updateError) {
          console.error(`Error updating page ${page.page_number}:`, updateError);
        } else {
          console.log(`Page ${page.page_number} illustration saved`);
        }

        if (page.page_number === 1) {
          firstIllustrationUrl = illustrationUrl;
        }
      }

      // Minimal delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }

    // Check if ALL illustration pages now have illustration_url before marking as ready
    // This handles distributed mode where each page is generated by a separate invocation
    const { data: allIllustrationPages } = await supabase
      .from("story_pages")
      .select("page_number, illustration_prompt, illustration_url")
      .eq("story_id", storyId)
      .not("illustration_prompt", "is", null);

    const totalNeeded = allIllustrationPages?.length || 0;
    const totalDone = allIllustrationPages?.filter(p => p.illustration_url)?.length || 0;
    console.log(`Illustration progress: ${totalDone}/${totalNeeded} pages completed`);

    if (totalDone >= totalNeeded) {
      const { error: statusError } = await supabase
        .from("stories")
        .update({ generation_status: "ready" })
        .eq("id", storyId);

      if (statusError) {
        console.error("Error updating story status:", statusError);
      }
      console.log(`✅ Story ${storyId} ALL illustrations completed — status set to ready!`);
    } else {
      console.log(`Story ${storyId}: ${totalDone}/${totalNeeded} done, waiting for other invocations`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        storyId,
        message: "Illustrations generated successfully",
        usedSavedProfile: savedProfileFromDb
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-illustrations:", error);
    
    // Try to update story status to failed
    try {
      const { storyId } = await req.json();
      if (storyId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("stories")
          .update({ generation_status: "failed" })
          .eq("id", storyId);
      }
    } catch {}
    
    return new Response(
      JSON.stringify({ error: "Error generating illustrations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
