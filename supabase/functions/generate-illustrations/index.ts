import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logError } from "../_shared/log-error.ts";
import {
  PIXAR_STYLE,
  PIXAR_STYLE_COMPACT,
  NEGATIVE_PROMPT,
  NEGATIVE_PROMPT_FULL,
  CAST_NEGATIVE_PROMPT,
  ADVENTURE_TOPICS,
  SOL_CASUAL_URL,
  SOL_HERO_URL,
  MOM_CARMEN_URL,
  CHARACTER_BASE_REFS,
  CHARACTER_BASE_REFS_WITH_MOM,
  buildCharacterRefs,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  // Female default is modeled after Sol: 4yo, long dark brown hair in high bun with pink band, superhero costume
  const isFemale = childGender === "female";
  return {
    gender: childGender,
    genderHebrew: genderHebrew,
    hairDescription: isFemale ? "long dark brown hair styled in a high bun with a pink hair band" : "short tousled dark brown hair",
    clothingDescription: isFemale ? "a superhero costume — red cape, light blue shirt with a golden star emblem on the chest, purple pants, and white sneakers" : "colorful casual clothes",
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

interface IllustrationResult {
  imageData: string | null;
  modelUsed: string;
  fallbackReason?: string;
  durationMs?: number;
}

// Helper: generate illustration with face reference via Gemini Image Generation
// Uses google/gemini-3-pro-image-preview for text-to-image with face reference
async function generateIllustrationWithFace(
  prompt: string,
  childPhotoUrl: string,
  characterProfile: CharacterProfile | null,
  storyOutfit: string,
  visualAnchor: string,
  adventureLogic?: { outfit: string; background: string; theme: string },
): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for Gemini Image Generation");
      return null;
    }

    const adventureInstruction = adventureLogic
      ? `Setting: ${adventureLogic.background}. Theme: ${adventureLogic.theme}.`
      : "";

    const illustrationPrompt = `FACE REFERENCE: The main character's face MUST be an EXACT 3D Pixar rendering of the child in the reference photo. Keep all facial features, hair color, hair texture, and skin tone identical.

STYLE: ${PIXAR_STYLE}

${adventureInstruction}

SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${prompt}

NEGATIVE: ${CAST_NEGATIVE_PROMPT}`;

    console.log("Generating illustration via Gemini Image Generation (face reference)...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: childPhotoUrl } },
            { type: "text", text: illustrationPrompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "no body");
      console.error(`Gemini Image Generation failed: ${response.status} - ${errorBody}`);
      await logError("illustration_gemini_error", `Gemini Image Gen failed: ${response.status}`, { status: response.status, body: errorBody.substring(0, 500) });
      return null;
    }

    let data: any;
    try {
      const rawText = await response.text();
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Gemini Image Gen: Failed to parse response JSON:", parseErr);
      await logError("illustration_gemini_error", `Gemini Image Gen: JSON parse failed - ${parseErr?.message || parseErr}`, { model: "google/gemini-3-pro-image-preview" });
      return null;
    }

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (imageUrl) {
      console.log("Gemini illustration generated successfully");
      return imageUrl;
    }

    console.warn("Gemini Image Generation: no image in response", JSON.stringify(data).substring(0, 200));
    return null;
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    const errorType = isTimeout ? "illustration_timeout" : "illustration_gemini_error";
    console.error("Error in Gemini Image Generation:", error);
    await logError(errorType, `Gemini Image Gen: ${error?.message || error}`, { model: "google/gemini-3-pro-image-preview" });
    return null;
  }
}

// Helper: generate illustration WITHOUT face reference via Gemini Image Generation
// Same Pixar 3D CGI style as face-reference version for visual consistency
async function generateIllustrationGeminiNoFace(
  prompt: string,
  characterProfile: CharacterProfile | null,
  storyOutfit: string,
  visualAnchor: string,
  adventureLogic?: { outfit: string; background: string; theme: string },
): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured for Gemini Image Generation");
      return null;
    }

    const adventureInstruction = adventureLogic
      ? `Setting: ${adventureLogic.background}. Theme: ${adventureLogic.theme}.`
      : "";

    const illustrationPrompt = `${visualAnchor}

STYLE: ${PIXAR_STYLE}

${adventureInstruction}

SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${prompt}

NEGATIVE: ${NEGATIVE_PROMPT}`;

    console.log("Generating illustration via Gemini Image Generation (no face reference)...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: illustrationPrompt,
        }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "no body");
      console.error(`Gemini Image Generation (no face) failed: ${response.status} - ${errorBody}`);
      await logError("illustration_gemini_noface_error", `Gemini no-face failed: ${response.status}`, { status: response.status, body: errorBody.substring(0, 500) });
      return null;
    }

    let data: any;
    try {
      const rawText = await response.text();
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Gemini Image Gen (no face): Failed to parse response JSON:", parseErr);
      await logError("illustration_gemini_noface_error", `Gemini no-face: JSON parse failed - ${parseErr?.message || parseErr}`, { model: "google/gemini-3-pro-image-preview" });
      return null;
    }

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (imageUrl) {
      console.log("Gemini illustration (no face) generated successfully");
      return imageUrl;
    }

    console.warn("Gemini Image Generation (no face): no image in response", JSON.stringify(data).substring(0, 200));
    return null;
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    const errorType = isTimeout ? "illustration_timeout" : "illustration_gemini_noface_error";
    console.error("Error in Gemini Image Generation (no face):", error);
    await logError(errorType, `Gemini no-face: ${error?.message || error}`, { model: "google/gemini-3-pro-image-preview" });
    return null;
  }
}

// Helper function to generate illustration using Fal.ai Flux Schnell (FALLBACK ONLY)
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

    const stylePrefix = PIXAR_STYLE_COMPACT;

    const negativePrompt = NEGATIVE_PROMPT_FULL;

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
      await logError("illustration_fal_error", `Flux Schnell failed: ${response.status}`, { status: response.status, body: errorBody.substring(0, 500) });
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
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    const errorType = isTimeout ? "illustration_timeout" : "illustration_fal_error";
    console.error("Error generating illustration:", error);
    await logError(errorType, `Flux Schnell: ${error?.message || error}`, { model: "fal-ai/flux/schnell" });
    return null;
  }
}

// Camera angles rotated per page to ensure visual variety
const CAMERA_ANGLES = [
  "close-up portrait shot focusing on the character's face and upper body",
  "wide establishing shot showing the full scene and environment",
  "medium shot from waist up with environment visible behind",
  "bird's eye view looking down at the scene from above",
  "low angle shot looking up at the character heroically",
  "over-the-shoulder shot from behind the character looking at the scene ahead",
];

const LIGHTING_OPTIONS = [
  "warm golden sunlight with soft shadows",
  "soft diffused daylight with pastel tones",
  "dramatic side lighting with rich contrast",
  "magical glowing light from enchanted objects",
  "cozy warm indoor lamplight",
  "bright cheerful midday sun with vivid colors",
];

interface SceneAnalysis {
  scene_action: string;
  environment: string;
  camera_angle: string;
  lighting: string;
  mood: string;
  character_action: string;
}

// Analyze page text with Gemini Flash to extract rich scene details
async function analyzePageScene(
  pageText: string,
  pageNumber: number,
  totalPages: number,
  topic: string,
  apiKey: string
): Promise<SceneAnalysis | null> {
  try {
    // Enforce camera angle rotation so consecutive pages never share the same angle
    const forcedAngle = CAMERA_ANGLES[pageNumber % CAMERA_ANGLES.length];
    const forcedLighting = LIGHTING_OPTIONS[(pageNumber + 2) % LIGHTING_OPTIONS.length];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a children's book illustrator director. Given a page of Hebrew children's story text, extract a vivid visual scene description for an illustration. CRITICAL: The illustration MUST depict EXACTLY what the text describes — do NOT change the action, objects, or characters. If the text says "hugging a teddy bear", the scene_action and character_action MUST show hugging a teddy bear, NOT something else. Be specific and concrete — avoid generic descriptions. Each page must look completely different.`
          },
          {
            role: "user",
            content: `Story topic: "${topic}"
Page ${pageNumber} of ${totalPages}.
Text: "${pageText}"

IMPORTANT: Extract the scene EXACTLY as described in the text. Do NOT invent new actions or objects that aren't in the text. The illustration must match the text precisely.
The camera angle MUST be: "${forcedAngle}". The lighting MUST be: "${forcedLighting}".`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "describe_scene",
              description: "Extract a detailed visual scene description from children's story page text",
              parameters: {
                type: "object",
                properties: {
                  scene_action: {
                    type: "string",
                    description: "What is happening in this specific scene — describe the main event/action vividly in English (e.g., 'discovering a hidden cave behind a waterfall with glowing crystals inside')"
                  },
                  environment: {
                    type: "string",
                    description: "Detailed environment/background description in English (e.g., 'a lush enchanted forest clearing with giant mushrooms, fireflies, and a sparkling stream')"
                  },
                  camera_angle: {
                    type: "string",
                    description: "The exact camera angle provided — use it as-is"
                  },
                  lighting: {
                    type: "string",
                    description: "The exact lighting description provided — use it as-is"
                  },
                  mood: {
                    type: "string",
                    description: "The emotional mood of the scene in English (e.g., 'wonderous and magical', 'tense but hopeful', 'joyful and celebratory')"
                  },
                  character_action: {
                    type: "string",
                    description: "Exactly what the main character is physically doing in English (e.g., 'kneeling down and reaching into a glowing pool of water', 'running with arms spread wide like airplane wings')"
                  }
                },
                required: ["scene_action", "environment", "camera_angle", "lighting", "mood", "character_action"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "describe_scene" } },
      }),
    });

    if (!response.ok) {
      console.warn(`Scene analysis failed (${response.status}), using fallback`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const scene = JSON.parse(toolCall.function.arguments) as SceneAnalysis;
      // Enforce the rotated angle/lighting even if AI ignored it
      scene.camera_angle = forcedAngle;
      scene.lighting = forcedLighting;
      console.log(`🎬 Page ${pageNumber} scene: ${scene.character_action} in ${scene.environment.substring(0, 60)}...`);
      return scene;
    }

    return null;
  } catch (error) {
    console.warn(`Scene analysis error for page ${pageNumber}:`, error);
    return null;
  }
}

// Build a rich, unique prompt from AI scene analysis
function buildScenePrompt(
  scene: SceneAnalysis,
  characterDesc: string,
  originalPrompt: string
): string {
  // The original illustration_prompt is THE PRIMARY source of truth — it was written to match the page text exactly.
  // Scene analysis only adds camera/lighting/mood variety but MUST NOT override the core action or objects.
  const sceneBase = originalPrompt || `${scene.character_action}, ${scene.scene_action}`;
  // Only use scene.character_action if it doesn't contradict the original prompt
  const actionNote = originalPrompt ? `(follow the scene description above precisely)` : `ACTION: ${scene.character_action}`;
  return `${characterDesc}. SCENE (MUST MATCH TEXT EXACTLY): ${sceneBase}. ${actionNote}. ENVIRONMENT: ${scene.environment}. CAMERA: ${scene.camera_angle}. LIGHTING: ${scene.lighting}. MOOD: ${scene.mood}. Pixar 3D CGI style, vibrant colors, fantasy children's book, full body head to toe with feet grounded on surface`;
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
      
      // === AI SCENE ANALYSIS — build a unique, rich prompt per page ===
      const basePrompt = page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
      let illustrationPrompt = basePrompt;

      const scene = await analyzePageScene(
        page.text || basePrompt,
        page.page_number,
        pagesToIllustrate.length,
        topic || "",
        LOVABLE_API_KEY
      );

      if (scene) {
        // Build character description from profile
        const charDesc = characterProfile
          ? `A ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, ${characterProfile.eyeColor} eyes, wearing ${storyOutfit}`
          : `A child wearing ${storyOutfit}`;
        illustrationPrompt = buildScenePrompt(scene, charDesc, basePrompt);
        console.log(`📝 Page ${page.page_number} enriched prompt (${illustrationPrompt.length} chars)`);
      } else {
        console.log(`⚠️ Page ${page.page_number} using original prompt (scene analysis failed)`);
      }

      let base64Image: string | null = null;
      let modelUsed = "unknown";
      let fallbackReason: string | undefined;
      const MAX_RETRIES = 2;
      const genStart = Date.now();
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        // Branch: use Gemini with face when child photo exists
        if (childPhotoSignedUrl) {
          base64Image = await generateIllustrationWithFace(
            illustrationPrompt,
            childPhotoSignedUrl,
            characterProfile,
            storyOutfit,
            visualAnchor,
            effectiveAdventureLogic,
          );
          if (base64Image) {
            modelUsed = "gemini_with_face";
            break;
          }
        } else {
          // No photo: try Gemini first (same Pixar 3D CGI style), then Flux Schnell as fallback
          base64Image = await generateIllustrationGeminiNoFace(
            illustrationPrompt,
            characterProfile,
            storyOutfit,
            visualAnchor,
            effectiveAdventureLogic,
          );
          if (base64Image) {
            modelUsed = "gemini_no_face";
            break;
          }
          
          fallbackReason = "Gemini no-face failed";
          console.log(`Gemini no-face failed for page ${page.page_number}, trying Flux Schnell fallback...`);
          base64Image = await generateIllustration(
            illustrationPrompt,
            effectivePhoto,
            characterProfile,
            LOVABLE_API_KEY,
            storyOutfit,
            visualAnchor,
            effectiveAdventureLogic,
            topic
          );
          if (base64Image) {
            modelUsed = "fal_schnell_fallback";
            break;
          }
          fallbackReason = "Both Gemini no-face and Fal Schnell failed";
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
      const durationMs = Date.now() - genStart;

      if (!base64Image) {
        console.log(`Page ${page.page_number}: no image`);
        // Log failed attempt
        await supabase.from("illustration_logs").insert({
          story_id: storyId,
          page_number: page.page_number,
          model_used: modelUsed === "unknown" ? "none_failed" : modelUsed,
          fallback_reason: fallbackReason || "All attempts failed",
          had_face_reference: !!childPhotoSignedUrl,
          duration_ms: durationMs,
        });
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

        // Log successful illustration generation
        await supabase.from("illustration_logs").insert({
          story_id: storyId,
          page_number: page.page_number,
          model_used: modelUsed,
          fallback_reason: fallbackReason || null,
          had_face_reference: !!childPhotoSignedUrl,
          duration_ms: durationMs,
        });

        if (page.page_number === 1) {
          firstIllustrationUrl = illustrationUrl;
        }
      }

      // === SECOND ILLUSTRATION (age 0-2 dual layout) ===
      if (page.illustration_prompt_2) {
        console.log(`Generating SECOND illustration for page ${page.page_number} (toddler dual layout)...`);
        const secondPrompt = page.illustration_prompt_2;
        let secondImage: string | null = null;

        // Use scene analysis for the second prompt too
        const scene2 = await analyzePageScene(
          secondPrompt,
          page.page_number + 100, // offset to get different camera angle
          pagesToIllustrate.length,
          topic || "",
          LOVABLE_API_KEY
        );

        let secondIllustrationPrompt = secondPrompt;
        if (scene2) {
          const charDesc2 = characterProfile
            ? `A ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, ${characterProfile.eyeColor} eyes, wearing ${storyOutfit}`
            : `A child wearing ${storyOutfit}`;
          secondIllustrationPrompt = buildScenePrompt(scene2, charDesc2, secondPrompt);
        }

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          if (childPhotoSignedUrl) {
            secondImage = await generateIllustrationWithFace(
              secondIllustrationPrompt, childPhotoSignedUrl, characterProfile,
              storyOutfit, visualAnchor, effectiveAdventureLogic,
            );
          } else {
            secondImage = await generateIllustrationGeminiNoFace(
              secondIllustrationPrompt, characterProfile,
              storyOutfit, visualAnchor, effectiveAdventureLogic,
            );
            if (!secondImage) {
              secondImage = await generateIllustration(
                secondIllustrationPrompt, effectivePhoto, characterProfile,
                LOVABLE_API_KEY, storyOutfit, visualAnchor, effectiveAdventureLogic, topic
              );
            }
          }
          if (secondImage) break;
          if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000));
        }

        if (secondImage) {
          const secondUrl = await uploadImageToStorage(supabase, secondImage, storyId, page.page_number * 10 + 2);
          if (secondUrl) {
            await supabase.from("story_pages").update({ illustration_url_2: secondUrl }).eq("id", page.id);
            console.log(`Page ${page.page_number} SECOND illustration saved`);
          }
        } else {
          console.warn(`Page ${page.page_number}: second illustration failed`);
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
    await logError("illustration_general_error", `generate-illustrations crash: ${error?.message || error}`, {});
    
    return new Response(
      JSON.stringify({ error: "Error generating illustrations" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
