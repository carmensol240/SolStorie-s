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
  CHARACTER_CONSISTENCY_PROMPT,
} from "../_shared/style-config.ts";

// Strict negative instruction — illustrations must be pure children's book art only
const NO_UI_NEGATIVE = `STRICT: DO NOT include any thumbnails, screenshots, UI elements, app interfaces, image grids, photo galleries, app screens, mobile/tablet/computer screens, browser windows, icons, buttons, menus, toolbars, status bars, or any digital device screens within the illustration. The illustration must show ONLY the story character and the background scene — clean, pure children's book illustration style with no UI elements whatsoever.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build a public URL for an illustration stored in the public `story-illustrations` bucket.
// Used so that the first-page illustration can be re-sent as a visual reference to Gemini
// on subsequent pages, locking character appearance across the story.
const SUPABASE_PUBLIC_URL = Deno.env.get("SUPABASE_URL") || "";
const STORY_ILLUSTRATIONS_PUBLIC_BASE = `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/story-illustrations`;
function buildPublicIllustrationUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STORY_ILLUSTRATIONS_PUBLIC_BASE}/${path}`;
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
  const genderClothingRule = profile.gender === "female"
    ? "This character is a GIRL — feminine or neutral clothing only; NEVER kippah/yarmulke/tzitzit or any male religious symbols."
    : "This character is a BOY — masculine clothing only (pants/shorts/t-shirt/hoodie/sneakers); NEVER a dress, skirt, tutu, flower crown, hair bow, makeup, or any feminine clothing or accessories.";
  return `VISUAL ANCHOR (use this EXACT description for the main character in EVERY illustration):
A ${genderWord} aged ${profile.ageDescription} with ${profile.hairDescription}, ${profile.skinTone} skin, and ${profile.eyeColor} eyes. Wearing ${storyOutfit}. 
${genderClothingRule}
${CHARACTER_CONSISTENCY_PROMPT}`;
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
  coverReferenceUrl?: string | null,
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

    const coverReferenceBlock = coverReferenceUrl
      ? `\n\nSTYLE & CHARACTER REFERENCE (SECOND IMAGE): The SECOND image attached is a finished Pixar 3D illustration of the SAME main character from EARLIER in this same storybook. The character in this new page MUST MATCH that second image EXACTLY — same face shape, same hair color/style, same skin tone, same outfit, same proportions, same Pixar 3D rendering style. Treat the second image as the canonical look of this character. Only the scene/pose/background changes; the character itself does not.`
      : "";

    const illustrationPrompt = `FACE REFERENCE (FIRST IMAGE): The main character's face MUST be an EXACT 3D Pixar rendering of the child in the FIRST reference photo. Keep all facial features, hair color, hair texture, and skin tone identical.${coverReferenceBlock}

STYLE: ${PIXAR_STYLE}

${adventureInstruction}

SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${prompt}

${CHARACTER_CONSISTENCY_PROMPT}

NEGATIVE: ${CAST_NEGATIVE_PROMPT}

${NO_UI_NEGATIVE}`;

    console.log(`Generating illustration via Gemini Image Generation (face reference${coverReferenceUrl ? " + cover reference" : ""})...`);

    const messageContent: any[] = [
      { type: "image_url", image_url: { url: childPhotoUrl } },
    ];
    if (coverReferenceUrl) {
      messageContent.push({ type: "image_url", image_url: { url: coverReferenceUrl } });
    }
    messageContent.push({ type: "text", text: illustrationPrompt });

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
          content: messageContent,
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
  coverReferenceUrl?: string | null,
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

    const coverReferenceBlock = coverReferenceUrl
      ? `\n\nSTYLE & CHARACTER REFERENCE (ATTACHED IMAGE): The attached image is a finished Pixar 3D illustration of the SAME main character from EARLIER in this same storybook. The character in this new page MUST MATCH that image EXACTLY — same face, same hair color/style, same skin tone, same outfit, same proportions, same Pixar 3D rendering style. Treat the attached image as the canonical look of this character. Only the scene/pose/background changes; the character itself does not.`
      : "";

    const illustrationPrompt = `${visualAnchor}${coverReferenceBlock}

STYLE: ${PIXAR_STYLE}

${adventureInstruction}

SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${prompt}

${CHARACTER_CONSISTENCY_PROMPT}

NEGATIVE: ${NEGATIVE_PROMPT}

${NO_UI_NEGATIVE}`;

    console.log(`Generating illustration via Gemini Image Generation (no face reference${coverReferenceUrl ? ", with cover reference" : ""})...`);

    const messageContent: any = coverReferenceUrl
      ? [
          { type: "image_url", image_url: { url: coverReferenceUrl } },
          { type: "text", text: illustrationPrompt },
        ]
      : illustrationPrompt;

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
          content: messageContent,
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
    // HARD GUARD: when a child photo exists, NEVER fall back to Flux Schnell.
    // Flux has no face reference and breaks character consistency. The caller must
    // retry Gemini (face or no-face) instead. This guard makes the policy explicit
    // even if future call sites forget to gate the fallback themselves.
    if (childPhoto) {
      console.warn("⚠️ generateIllustration (Flux Schnell) called while childPhoto exists — refusing fallback to preserve character consistency. Caller should retry Gemini.");
      return null;
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY is not configured, cannot generate illustration");
      return null;
    }

    const finalOutfit = storyOutfit || adventureLogic?.outfit || characterProfile?.clothingDescription || "colorful casual clothes";

    const characterInstruction = characterProfile
      ? `The main character is a ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, and ${characterProfile.eyeColor} eyes. Wearing ${finalOutfit}. ${characterProfile.gender === "female" ? "This character is a GIRL — feminine or neutral clothing only; NEVER kippah, yarmulke, tzitzit or any male religious symbols." : "This character is a BOY — masculine clothing only (pants/shorts/t-shirt/hoodie/sneakers); ABSOLUTELY NO dress, skirt, tutu, flower crown, hair bow, makeup or any feminine clothing or accessories."} This character must look IDENTICAL in every illustration — same face, hair, outfit, proportions.`
      : "";

    const adventureInstruction = adventureLogic
      ? `Setting: ${adventureLogic.background}. Theme: ${adventureLogic.theme}.`
      : "";

    const stylePrefix = PIXAR_STYLE_COMPACT;

    const negativePrompt = NEGATIVE_PROMPT_FULL;

    const fullPrompt = `${stylePrefix}\n\n${visualAnchor}\n\n${characterInstruction}\n${adventureInstruction}\n\nSCENE: ${prompt}\n\n${CHARACTER_CONSISTENCY_PROMPT}\n\nNEGATIVE: ${negativePrompt}\n\n${NO_UI_NEGATIVE}`;

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

// === AI-BASED DYNAMIC OUTFIT GENERATION ===
async function generateOutfitForTopic(topic: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`🎽 Generating AI outfit for topic: "${topic}"...`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a children's book costume designer. Given a story topic in Hebrew, return ONLY a single short English sentence (max 15 words) describing what a child character should wear in that story.

Rules:
- The outfit must be age-appropriate for a 3-8 year old child
- Be specific about colors, materials, and style
- For biblical/historical topics: describe period-accurate but child-friendly clothing
- For fantasy/magic topics: describe magical/whimsical clothing
- For nature/animal topics: describe outdoor/explorer clothing
- For space topics: describe astronaut or sci-fi clothing
- For holiday/celebration topics: describe festive clothing matching the holiday
- For everyday/neutral topics (emotions, friendship, family, fears, siblings, kindness, sharing, manners): respond with exactly "KEEP_ORIGINAL"
- For hygiene topics (bath, teeth, hands, potty): respond with exactly "KEEP_ORIGINAL"

Examples:
"חנוכה" → "traditional Jewish festive blue and white tunic with a golden Star of David necklace and a blue hair ribbon"
IMPORTANT: For female characters, NEVER include a kippah. Use a blue hair ribbon, bow, or decorative headband instead. Kippah is only for male characters.
"יציאת מצרים" → "ancient Egyptian-style linen tunic with leather sandals and a woven belt"
"נח ותיבת נח" → "simple rustic brown robe with a rope belt and wooden sandals"
"יוסף ואחיו" → "colorful striped coat of many colors over a simple tunic"
"דוד וגוליית" → "light shepherd clothing with a leather sling and small pouch"
"אסתר המלכה" → "royal Persian gown with a golden crown and jeweled necklace"
"חלל" → "white astronaut space suit with a transparent helmet and mission patches"
"ג'ונגל" → "khaki safari outfit with a wide-brimmed explorer hat and binoculars"
"ים וחוף" → "colorful swimsuit with a straw hat and sunglasses"
"יום הולדת" → "festive colorful party outfit with a birthday crown"
"פחד מהחושך" → "KEEP_ORIGINAL"
"חברות" → "KEEP_ORIGINAL"
"רגשות" → "KEEP_ORIGINAL"`
          },
          {
            role: "user",
            content: topic
          }
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`AI outfit generation failed: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result || result === "KEEP_ORIGINAL") {
      console.log(`🎽 Topic "${topic}" is neutral — keeping original clothing`);
      return null;
    }

    console.log(`🎽 AI outfit for "${topic}": "${result}"`);
    return result;
  } catch (err) {
    console.warn(`AI outfit generation error (timeout or network):`, err);
    return null;
  }
}

// Fast-path cache for common topics (avoids AI call)
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
  "dad-in-reserves": {
    outfit: "comfortable home clothes",
    background: "warm home environment with family photos and a military bag by the door",
    theme: "emotional family story about father going to military reserves"
  },
};
// ── Topic-specific cover prompts ──
const TOPIC_COVER_PROMPTS: Record<string, string> = {
  // ── Values ──
  "superheroes": "Children's book cover, Pixar 3D CGI style, a brave child standing heroically on a rooftop with a cape flowing in the wind, golden sunset, city skyline. No text. Leave 20% space at top for title.",
  "body-safety": "Children's book cover, Pixar 3D CGI style, a confident child standing tall with arms crossed and a protective shield glowing around them, warm safe colors. No text. Leave 20% space at top for title.",
  "road-safety": "Children's book cover, Pixar 3D CGI style, a child at a crosswalk with a friendly traffic light character, bright sunny day, safe neighborhood. No text. Leave 20% space at top for title.",
  "environment": "Children's book cover, Pixar 3D CGI style, a child planting a tree in a lush green meadow, butterflies and sunshine, Earth glowing in the background. No text. Leave 20% space at top for title.",
  "we-are-special": "Children's book cover, Pixar 3D CGI style, diverse group of children holding hands in a circle, each glowing with a unique color, warm joyful atmosphere. No text. Leave 20% space at top for title.",
  "just-be-me": "Children's book cover, Pixar 3D CGI style, a child looking at their reflection in a magical mirror and smiling proudly, sparkling light around them. No text. Leave 20% space at top for title.",
  "helping-others": "Children's book cover, Pixar 3D CGI style, a child helping another child who fell, warm golden light, playground setting, kind expression. No text. Leave 20% space at top for title.",
  "stranger-danger": "Children's book cover, Pixar 3D CGI style, a child confidently saying no with a glowing protective bubble around them, safe neighborhood. No text. Leave 20% space at top for title.",
  "seatbelt-safety": "Children's book cover, Pixar 3D CGI style, a happy child buckling a seatbelt in a colorful car, friendly car character, sunny road. No text. Leave 20% space at top for title.",
  "blood-test": "Children's book cover, Pixar 3D CGI style, a brave child with a superhero cape getting a gentle blood test, friendly nurse, warm hospital room. No text. Leave 20% space at top for title.",
  "true-friendship": "Children's book cover, Pixar 3D CGI style, two children sitting together under a big tree sharing a moment, golden afternoon light. No text. Leave 20% space at top for title.",
  "accepting-differences": "Children's book cover, Pixar 3D CGI style, children of different appearances laughing together on a colorful playground, warm inclusive atmosphere. No text. Leave 20% space at top for title.",
  "helping-home": "Children's book cover, Pixar 3D CGI style, a child happily helping set a dinner table with family, cozy kitchen, warm lighting. No text. Leave 20% space at top for title.",

  // ── Emotions / Growing ──
  "body-hero-teeth": "Children's book cover, Pixar 3D CGI style, a child with a sparkly toothbrush fighting cartoon cavity monsters, bathroom setting, magical sparkles. No text. Leave 20% space at top for title.",
  "body-hero-bath": "Children's book cover, Pixar 3D CGI style, a joyful child in a bathtub surrounded by soap bubbles and rubber ducks, warm bathroom glow. No text. Leave 20% space at top for title.",
  "home-of-love": "Children's book cover, Pixar 3D CGI style, a child hugging a parent in a cozy living room, warm golden light, love hearts floating. No text. Leave 20% space at top for title.",
  "playing-together": "Children's book cover, Pixar 3D CGI style, children playing together in a sunny garden with a ball, green grass, flowers blooming. No text. Leave 20% space at top for title.",
  "body-hero-hands": "Children's book cover, Pixar 3D CGI style, a child washing hands with magical sparkly soap, cartoon germs running away, fun bathroom scene. No text. Leave 20% space at top for title.",
  "potty-training": "Children's book cover, Pixar 3D CGI style, a proud toddler sitting on a colorful potty with a big smile, confetti and stars, celebratory mood. No text. Leave 20% space at top for title.",
  "pacifier-fairy": "Children's book cover, Pixar 3D CGI style, a magical fairy collecting pacifiers in a glowing basket, starry night sky, dreamy atmosphere. No text. Leave 20% space at top for title.",
  "first-day-kindergarten": "Children's book cover, Pixar 3D CGI style, a child with a backpack standing excitedly at a colorful kindergarten entrance, warm morning light. No text. Leave 20% space at top for title.",
  "mom-dont-go": "Children's book cover, Pixar 3D CGI style, a mother hugging a child at the kindergarten door, tender emotional moment, soft warm lighting. No text. Leave 20% space at top for title.",
  "fear-of-dark": "Children's book cover, Pixar 3D CGI style, a child in bed looking up at friendly glowing stars and a smiling moon, cozy bedroom, gentle night light. No text. Leave 20% space at top for title.",
  "friendship-courage": "Children's book cover, Pixar 3D CGI style, two children meeting for the first time in a kindergarten, shy smiles, colorful playground. No text. Leave 20% space at top for title.",
  "sharing": "Children's book cover, Pixar 3D CGI style, two children happily sharing a toy together, warm playground setting, golden afternoon light. No text. Leave 20% space at top for title.",
  "apologize": "Children's book cover, Pixar 3D CGI style, a child extending a hand to another child with a sorry expression, rainbow appearing, reconciliation. No text. Leave 20% space at top for title.",
  "trying-again": "Children's book cover, Pixar 3D CGI style, a determined child building a tall block tower that wobbled before, sparkles of persistence, warm room. No text. Leave 20% space at top for title.",
  "independence": "Children's book cover, Pixar 3D CGI style, a proud child tying their own shoes with a big grin, morning light, bedroom setting. No text. Leave 20% space at top for title.",
  "anger-cloud": "Children's book cover, Pixar 3D CGI style, a child blowing away a dark angry cloud that transforms into a rainbow, emotional transformation scene. No text. Leave 20% space at top for title.",
  "brave-taster": "Children's book cover, Pixar 3D CGI style, a child bravely tasting a colorful plate of new foods, vegetables and fruits smiling, kitchen table. No text. Leave 20% space at top for title.",
  "clean-room": "Children's book cover, Pixar 3D CGI style, a child organizing toys into a magical treasure chest, sparkly clean room, accomplished feeling. No text. Leave 20% space at top for title.",
  "new-house": "Children's book cover, Pixar 3D CGI style, a child looking up at a new house with wonder, moving boxes around, warm welcoming light from windows. No text. Leave 20% space at top for title.",
  "dentist-visit": "Children's book cover, Pixar 3D CGI style, a child sitting in a friendly dentist chair with a kind dentist, bright clean office, reassuring smile. No text. Leave 20% space at top for title.",
  "barber-visit": "Children's book cover, Pixar 3D CGI style, a child sitting in a barber chair with a colorful cape, friendly barber, mirror reflection showing new haircut. No text. Leave 20% space at top for title.",
  "lost-tooth": "Children's book cover, Pixar 3D CGI style, a child holding a tiny tooth with a tooth fairy flying nearby, sparkly magical night scene. No text. Leave 20% space at top for title.",
  "body-hero-nails": "Children's book cover, Pixar 3D CGI style, a child getting nails trimmed with sparkly clean nails glowing, cozy bathroom setting. No text. Leave 20% space at top for title.",
  "new-sibling": "Children's book cover, Pixar 3D CGI style, a child gently touching a newborn baby's hand, nursery room, soft warm light, tender moment. No text. Leave 20% space at top for title.",
  "bedtime-story": "Children's book cover, Pixar 3D CGI style, a parent reading a storybook to a child in a cozy bed, warm lamp light, dreamy stars floating. No text. Leave 20% space at top for title.",
  "pocket-kiss": "Children's book cover, Pixar 3D CGI style, a mother placing a glowing kiss into a child's pocket, magical sparkles, warm morning light. No text. Leave 20% space at top for title.",
  "sibling-love": "Children's book cover, Pixar 3D CGI style, siblings hugging and laughing together, pillow fort in background, warm cozy room. No text. Leave 20% space at top for title.",
  "my-special-family": "Children's book cover, Pixar 3D CGI style, a loving family group hug with warm golden light, cozy home, hearts floating around. No text. Leave 20% space at top for title.",
  "find-a-friend": "Children's book cover, Pixar 3D CGI style, a lonely child on a bench who notices another child approaching with a smile, playground, hopeful golden light. No text. Leave 20% space at top for title.",
  "screen-time": "Children's book cover, Pixar 3D CGI style, a child putting down a tablet and looking out at an exciting colorful world outside the window. No text. Leave 20% space at top for title.",
  "divorce": "Children's book cover, Pixar 3D CGI style, a child standing between two cozy houses connected by a glowing heart bridge, warm twilight sky. No text. Leave 20% space at top for title.",
  "sick-grandparent": "Children's book cover, Pixar 3D CGI style, a child holding a grandparent's hand gently, cozy room with flowers, warm emotional light. No text. Leave 20% space at top for title.",
  "making-mistakes": "Children's book cover, Pixar 3D CGI style, a child looking at a broken vase then looking up with courage, a green sprout growing from the pieces. No text. Leave 20% space at top for title.",
  "crying-is-ok": "Children's book cover, Pixar 3D CGI style, a child with a single tear becoming a rainbow, comforting hug from parent, warm safe atmosphere. No text. Leave 20% space at top for title.",
  "safe-room-sirens": "Children's book cover, Pixar 3D CGI style, a family huddled together safely in a cozy shelter room, warm protective light, sense of togetherness. No text. Leave 20% space at top for title.",
  "dad-in-reserves": "A heartwarming children's book cover illustration in Pixar 3D CGI style, Israeli soldier father in olive green IDF military uniform (yarok tzava fatigues) hugging his young child warmly, emotional reunion, soft warm cinematic lighting, vibrant saturated colors, Disney-Pixar aesthetic, NOT US military, NOT American military. No text. Leave 20% space at top for title.",

  // ── Creativity / Imagination ──
  "zoo-adventure": "Children's book cover, Pixar 3D CGI style, a child surrounded by friendly zoo animals - giraffe, lion cub, monkey, colorful zoo entrance, sunny day. No text. Leave 20% space at top for title.",
  "cloud-adventure": "Children's book cover, Pixar 3D CGI style, a child riding on a fluffy white cloud above a magical landscape, rainbow trails, dreamy sky. No text. Leave 20% space at top for title.",
  "magic-kingdom": "Children's book cover, Pixar 3D CGI style, a child at the gates of a sparkling magical kingdom with towers and a friendly dragon, golden light. No text. Leave 20% space at top for title.",
  "rain-party": "Children's book cover, Pixar 3D CGI style, a child dancing joyfully in the rain with colorful boots and umbrella, puddles splashing, rainbow forming. No text. Leave 20% space at top for title.",
  "underwater": "Children's book cover, Pixar 3D CGI style, a child swimming underwater with colorful tropical fish, coral reefs, sunbeams through water, magical ocean. No text. Leave 20% space at top for title.",
  "magical-forest": "Children's book cover, Pixar 3D CGI style, a child walking through an enchanted forest with glowing mushrooms, talking trees, magical fireflies. No text. Leave 20% space at top for title.",
  "space-adventure": "Children's book cover, Pixar 3D CGI style, a child in a fun spacesuit floating among colorful planets and stars, rocket ship nearby, cosmic adventure. No text. Leave 20% space at top for title.",
  "magic-keys": "Children's book cover, Pixar 3D CGI style, a child holding glowing magical keys in front of mysterious doors, each door showing a different world, fantasy light. No text. Leave 20% space at top for title.",
  "cloud-kingdom": "Children's book cover, Pixar 3D CGI style, a child exploring a kingdom built entirely of clouds, cloud castles and cloud creatures, dreamy pastel sky. No text. Leave 20% space at top for title.",
  "dragon-party": "Children's book cover, Pixar 3D CGI style, a child dancing with friendly colorful dragons at a party, rainbow fire, festive forest clearing. No text. Leave 20% space at top for title.",
  "strange-inventions": "Children's book cover, Pixar 3D CGI style, a child inventor with goggles surrounded by wacky contraptions, gears and springs, creative workshop. No text. Leave 20% space at top for title.",
  "dinosaurs": "Children's book cover, Pixar 3D CGI style, a child riding on a friendly baby dinosaur, prehistoric jungle, volcanic mountains in background, adventure. No text. Leave 20% space at top for title.",
  "cardboard-house": "Children's book cover, Pixar 3D CGI style, a child inside a giant cardboard box transformed into a castle, imagination sparkles, living room. No text. Leave 20% space at top for title.",
  "candy-alive": "Children's book cover, Pixar 3D CGI style, a child surrounded by dancing candy characters - lollipops, gummy bears, chocolate bars - in a candy wonderland. No text. Leave 20% space at top for title.",
  "talking-toys": "Children's book cover, Pixar 3D CGI style, toys coming alive at night - teddy bear, robot and doll having an adventure, moonlit bedroom. No text. Leave 20% space at top for title.",
  "farm-animals": "Children's book cover, Pixar 3D CGI style, a child surrounded by cute farm animals - cow, chicken, sheep, pig - sunny farm, red barn. No text. Leave 20% space at top for title.",
  "unicorn": "Children's book cover, Pixar 3D CGI style, a child riding a sparkling unicorn through a rainbow sky, flower fields below, magical glittering light. No text. Leave 20% space at top for title.",

  // ── Adventure / Curiosity ──
  "family-trip": "Children's book cover, Pixar 3D CGI style, a happy family hiking on a beautiful nature trail, mountains, blue sky, adventure backpacks. No text. Leave 20% space at top for title.",
  "birthday-party": "Children's book cover, Pixar 3D CGI style, a child blowing out candles on a colorful birthday cake, balloons, confetti, happy friends around. No text. Leave 20% space at top for title.",
  "grandparents-night": "Children's book cover, Pixar 3D CGI style, a child cuddling with grandparents on a cozy couch, warm lamp light, storybook open, cookies on table. No text. Leave 20% space at top for title.",
  "flying-vacation": "Children's book cover, Pixar 3D CGI style, a child excitedly looking out an airplane window at clouds and tiny cities below, golden sunset. No text. Leave 20% space at top for title.",
  "space-journey": "Children's book cover, Pixar 3D CGI style, a child astronaut floating among colorful planets, Saturn's rings, distant galaxies, awe-inspiring cosmos. No text. Leave 20% space at top for title.",
  "nature-secrets": "Children's book cover, Pixar 3D CGI style, a child with a magnifying glass discovering tiny creatures and flowers in a lush forest, golden light. No text. Leave 20% space at top for title.",
  "how-body-works": "Children's book cover, Pixar 3D CGI style, a child looking amazed at a transparent magical view inside the human body, heart beating, colorful organs. No text. Leave 20% space at top for title.",
  "shabbat": "Children's book cover, Pixar 3D CGI style, a family gathered around a Shabbat table with lit candles, challah bread, warm golden glow, cozy Friday evening. No text. Leave 20% space at top for title.",
  "pets": "Children's book cover, Pixar 3D CGI style, a child hugging a cute puppy and kitten together, park setting, warm afternoon light, love and friendship. No text. Leave 20% space at top for title.",
  "cooking": "Children's book cover, Pixar 3D CGI style, a little chef child mixing a bowl with flour on nose, colorful kitchen, ingredients flying playfully. No text. Leave 20% space at top for title.",
  "joy": "Children's book cover, Pixar 3D CGI style, a child jumping joyfully with arms wide open, butterflies and sunshine, pure happiness, vibrant colors. No text. Leave 20% space at top for title.",

  // ── Edu Toolbox ──
  "waiting-in-line-edu": "Children's book cover, Pixar 3D CGI style, children standing patiently in a line, one child smiling knowing their turn is coming, school setting. No text. Leave 20% space at top for title.",
  "emotion-regulation-edu": "Children's book cover, Pixar 3D CGI style, a child taking a deep breath with calming waves of color around them, peaceful transformation. No text. Leave 20% space at top for title.",
  "holidays-seasons-edu": "Children's book cover, Pixar 3D CGI style, four quadrants showing a child in each season - spring flowers, summer sun, autumn leaves, winter snow. No text. Leave 20% space at top for title.",
  "play-rules-edu": "Children's book cover, Pixar 3D CGI style, children playing a board game fairly, taking turns, happy sportsmanship, colorful game pieces. No text. Leave 20% space at top for title.",
  "self-confidence-edu": "Children's book cover, Pixar 3D CGI style, a child standing on a stage with a confident pose, spotlight, cheering audience, golden moment. No text. Leave 20% space at top for title.",
  "honesty-edu": "Children's book cover, Pixar 3D CGI style, a child speaking truthfully with a warm glowing light coming from their heart, gentle honest expression. No text. Leave 20% space at top for title.",
  "cooperation-edu": "Children's book cover, Pixar 3D CGI style, children building something together as a team, each contributing a piece, teamwork, sunny outdoor. No text. Leave 20% space at top for title.",
  "patience-edu": "Children's book cover, Pixar 3D CGI style, a child sitting calmly waiting with a peaceful expression, hourglass with sparkly sand, serene setting. No text. Leave 20% space at top for title.",
  "politeness-edu": "Children's book cover, Pixar 3D CGI style, a child politely holding a door open for others, warm smiles, school hallway, kind gesture. No text. Leave 20% space at top for title.",
  "respecting-elders-edu": "Children's book cover, Pixar 3D CGI style, a child listening attentively to a wise grandparent telling a story, warm living room, respectful moment. No text. Leave 20% space at top for title.",
  "eating-with-cutlery-edu": "Children's book cover, Pixar 3D CGI style, a proud toddler eating neatly with a spoon and fork, sparkly clean cutlery, colorful plate, kitchen table. No text. Leave 20% space at top for title.",
  "rainbow-power-edu": "Children's book cover, Pixar 3D CGI style, a child holding a plate of colorful fruits and vegetables glowing with rainbow superpowers, energetic. No text. Leave 20% space at top for title.",

  // ── Torah Stories ──
  "moses-basket": "Children's book cover, Pixar 3D CGI style, baby Moses in a wicker basket floating on the Nile river, water lilies, soft warm light, magical. No text. Leave 20% space at top for title.",
  "exodus": "Children's book cover, Pixar 3D CGI style, Moses leading Israelites through the parted Red Sea, dramatic golden light, epic biblical scene. No text. Leave 20% space at top for title.",
  "noah-ark": "Children's book cover, Pixar 3D CGI style, Noah's ark with pairs of animals boarding, rainbow in the sky, warm magical light. No text. Leave 20% space at top for title.",
  "joseph-brothers": "Children's book cover, Pixar 3D CGI style, young Joseph wearing a magnificent colorful striped coat, desert sunset, ancient Canaan. No text. Leave 20% space at top for title.",
  "david-goliath": "Children's book cover, Pixar 3D CGI style, young David with a sling facing giant Goliath, dramatic light, ancient Israel. No text. Leave 20% space at top for title.",
  "abraham-sarah": "Children's book cover, Pixar 3D CGI style, Abraham and Sarah under a starry sky in the desert, warm campfire light, ancient times. No text. Leave 20% space at top for title.",
  "jonah-fish": "Children's book cover, Pixar 3D CGI style, Jonah inside a giant whale underwater, magical blue light, dramatic scene. No text. Leave 20% space at top for title.",
  "samson-hero": "Children's book cover, Pixar 3D CGI style, strong Samson with long hair, ancient Philistine setting, dramatic light. No text. Leave 20% space at top for title.",
  "esther-queen": "Children's book cover, Pixar 3D CGI style, Queen Esther in royal Persian palace wearing crown and purple dress, golden light. No text. Leave 20% space at top for title.",
  "hanukkah-miracle": "Children's book cover, Pixar 3D CGI style, golden menorah glowing with magical light in ancient Temple, warm golden atmosphere. No text. Leave 20% space at top for title.",
};

// ── Generate cover image for specific topics (runs in parallel with illustrations) ──
async function generateCoverImage(
  supabase: ReturnType<typeof createClient>,
  storyId: string,
  apiKey: string,
  topic: string,
): Promise<string | null> {
  try {
    const topicPrompt = TOPIC_COVER_PROMPTS[topic];
    if (!topicPrompt) return null;
    console.log(`🎨 Generating cover for topic "${topic}", story ${storyId}...`);
    const coverPrompt = `${topicPrompt} NEGATIVE: ${NEGATIVE_PROMPT}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: coverPrompt }],
      }),
    });

    if (!response.ok) {
      console.error(`Cover generation failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      console.warn("Cover generation returned no image");
      return null;
    }

    // Upload to storage
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const filePath = `${storyId}/cover-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Cover upload error:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from("story-illustrations").getPublicUrl(filePath);
    const fullCoverUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    await supabase.from("stories").update({ cover_url: fullCoverUrl }).eq("id", storyId);
    console.log(`✅ Cover saved for topic "${topic}" story ${storyId}: ${fullCoverUrl}`);
    return fullCoverUrl;
  } catch (err) {
    console.error("Cover generation error:", err);
    return null;
  }
}

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
      // Fast-path: check hardcoded cache first
      effectiveAdventureLogic = THEME_OUTFITS[topic] || null;
      if (effectiveAdventureLogic) {
        console.log(`Using cached theme outfit for "${topic}":`, effectiveAdventureLogic);
      }
    }

    // === DETERMINE SINGLE OUTFIT FOR ENTIRE STORY ===
    // This outfit will be used for ALL pages to ensure consistency
    let storyOutfit = effectiveAdventureLogic?.outfit || null;
    
    // If no cached outfit, use AI to generate one based on topic
    if (!storyOutfit && topic && LOVABLE_API_KEY) {
      const aiOutfit = await generateOutfitForTopic(topic, LOVABLE_API_KEY);
      if (aiOutfit) {
        storyOutfit = aiOutfit;
      }
    }
    
    // Final fallback
    storyOutfit = storyOutfit || characterProfile?.clothingDescription || "colorful casual clothes";
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

    console.log(`Generating ${pagesToIllustrate.length} illustrations in PARALLEL via Promise.all...`);

    // Resolve HTTP URL for child photo (Gemini requires HTTP URL, not base64)
    let childPhotoSignedUrl: string | null = null;
    if (effectivePhoto) {
      if (effectivePhoto.startsWith("http")) {
        childPhotoSignedUrl = effectivePhoto;
      } else if (effectivePhoto.startsWith("data:")) {
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
            console.log(`✅ Photo uploaded to storage, using signed URL`);
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
        console.log(`🖼️ Child photo available for face-consistent illustrations`);
      }
    }

    // === PARALLEL ILLUSTRATION GENERATION ===
    // Each page is processed independently and concurrently
    async function generatePageIllustration(
      page: typeof pagesToIllustrate[0],
      coverReferenceUrl: string | null,
    ) {
      console.log(`[Page ${page.page_number}] Starting illustration generation...`);
      if (coverReferenceUrl) {
        console.log(`[Page ${page.page_number}] 🔗 Using cover/page-1 illustration as additional reference for character consistency`);
      }

      // Build prompt directly from illustration_prompt — skip AI scene analysis for speed
      const basePrompt = page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
      const pageNarrative = (page.text || "").toString().slice(0, 400);
      const cameraAngle = CAMERA_ANGLES[page.page_number % CAMERA_ANGLES.length];
      const lighting = LIGHTING_OPTIONS[(page.page_number + 2) % LIGHTING_OPTIONS.length];
      const charDesc = characterProfile
        ? `A ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, ${characterProfile.eyeColor} eyes, wearing ${storyOutfit}. ${characterProfile.gender === "female" ? "GIRL — feminine/neutral clothing only, no kippah/tzitzit." : "BOY — masculine clothing only, NO dress, skirt, tutu, flower crown, bow, makeup, or feminine accessories."}`
        : `A child wearing ${storyOutfit}`;
      const sceneBlock = pageNarrative
        ? `SCENE (MUST MATCH THE STORY TEXT EXACTLY — illustrate precisely what happens in this page, not a different action):
STORY TEXT FOR THIS PAGE: "${pageNarrative}"
VISUAL DESCRIPTION: ${basePrompt}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above. Do not invent a different scene.`
        : `SCENE (MUST MATCH TEXT EXACTLY): ${basePrompt}`;
      let illustrationPrompt = `${charDesc}. ${sceneBlock}. CAMERA: ${cameraAngle}. LIGHTING: ${lighting}. Pixar 3D CGI style, vibrant colors, fantasy children's book, full body head to toe with feet grounded on surface`;
      console.log(`[Page ${page.page_number}] 📝 Direct prompt (${illustrationPrompt.length} chars, text-anchored=${!!pageNarrative})`);

      // Inject IDF military uniform for father in "dad-in-reserves" topic
      const FATHER_MILITARY_CLOTHING = "Israeli IDF military uniform, olive green (yarok tzava) fatigues, green combat boots, Israeli army green beret - NOT US army, NOT American military";
      if (topic === "dad-in-reserves") {
        const fatherKeywords = /father|dad|אב|אבא|daddy|papa/i;
        if (fatherKeywords.test(illustrationPrompt) || fatherKeywords.test(page.text || "")) {
          illustrationPrompt += ` IMPORTANT: The father character MUST be wearing: ${FATHER_MILITARY_CLOTHING}. This is consistent across ALL illustrations showing the father.`;
          console.log(`[Page ${page.page_number}] 🪖 Injected IDF military uniform for father`);
        }
      }

      // Inject learning topic instruction for letter/number stories
      const isLearningTopic = topic?.startsWith('letter-') || topic?.startsWith('number-');
      if (isLearningTopic) {
        const learningLetter = topic?.startsWith('letter-') ? topic.replace('letter-', '').toUpperCase() : null;
        const learningNumber = topic?.startsWith('number-') ? topic.replace('number-', '') : null;
        const learningTarget = learningLetter ? `Hebrew letter ${learningLetter}` : `number ${learningNumber}`;
        illustrationPrompt += ` CRITICAL LEARNING ELEMENT: This is an educational story. The ${learningTarget} MUST appear prominently in this illustration — it fills half the image and is fully visible, not cropped. The letter/number is large, clear, bold, 3D golden style, complete and uncut. Wide shot showing both the child and the full ${learningTarget}. The ${learningTarget} can appear on a wall, tree, sign, cloud, or magical floating object in the scene.`;
        console.log(`[Page ${page.page_number}] 🎓 Injected learning element: ${learningTarget}`);
      }

      let base64Image: string | null = null;
      let modelUsed = "unknown";
      let fallbackReason: string | undefined;
      const MAX_RETRIES = 2;
      const genStart = Date.now();

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (childPhotoSignedUrl) {
          base64Image = await generateIllustrationWithFace(
            illustrationPrompt, childPhotoSignedUrl, characterProfile,
            storyOutfit, visualAnchor, effectiveAdventureLogic,
            coverReferenceUrl,
          );
          if (base64Image) { modelUsed = "gemini_with_face"; break; }
          // No Flux fallback when childPhoto exists — loop will retry Gemini face path
          fallbackReason = `Gemini face failed (attempt ${attempt}); Flux fallback blocked because childPhoto exists`;
        } else {
          base64Image = await generateIllustrationGeminiNoFace(
            illustrationPrompt, characterProfile,
            storyOutfit, visualAnchor, effectiveAdventureLogic,
            coverReferenceUrl,
          );
          if (base64Image) { modelUsed = "gemini_no_face"; break; }

          fallbackReason = "Gemini no-face failed";
          console.log(`[Page ${page.page_number}] Gemini failed, trying Flux Schnell fallback...`);
          base64Image = await generateIllustration(
            illustrationPrompt, effectivePhoto, characterProfile,
            LOVABLE_API_KEY, storyOutfit, visualAnchor, effectiveAdventureLogic, topic
          );
          if (base64Image) { modelUsed = "fal_schnell_fallback"; break; }
          fallbackReason = "Both Gemini no-face and Fal Schnell failed";
        }

        if (base64Image) {
          if (attempt > 1) console.log(`[Page ${page.page_number}] ✅ Succeeded on retry ${attempt}`);
          break;
        }

        console.warn(`[Page ${page.page_number}] ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed, ${attempt < MAX_RETRIES ? 'retrying...' : 'giving up'}`);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      const durationMs = Date.now() - genStart;

      if (!base64Image) {
        console.log(`[Page ${page.page_number}] No image generated`);
        await supabase.from("illustration_logs").insert({
          story_id: storyId, page_number: page.page_number,
          model_used: modelUsed === "unknown" ? "none_failed" : modelUsed,
          fallback_reason: fallbackReason || "All attempts failed",
          had_face_reference: !!childPhotoSignedUrl, duration_ms: durationMs,
        });
        return null;
      }

      const illustrationUrl = await uploadImageToStorage(supabase, base64Image, storyId, page.page_number);

      if (illustrationUrl) {
        const { error: updateError } = await supabase
          .from("story_pages")
          .update({ illustration_url: illustrationUrl })
          .eq("id", page.id);

        if (updateError) {
          console.error(`[Page ${page.page_number}] Error updating:`, updateError);
        } else {
          console.log(`[Page ${page.page_number}] ✅ Illustration saved`);
        }

        await supabase.from("illustration_logs").insert({
          story_id: storyId, page_number: page.page_number,
          model_used: modelUsed, fallback_reason: fallbackReason || null,
          had_face_reference: !!childPhotoSignedUrl, duration_ms: durationMs,
        });

        if (page.page_number === 1) {
          firstIllustrationUrl = illustrationUrl;
        }
      }

      // === SECOND ILLUSTRATION (age 0-2 dual layout) ===
      if (page.illustration_prompt_2) {
        console.log(`[Page ${page.page_number}] Generating SECOND illustration (toddler dual layout)...`);
        const secondPrompt = page.illustration_prompt_2;
        let secondImage: string | null = null;

        const cameraAngle2 = CAMERA_ANGLES[(page.page_number + 3) % CAMERA_ANGLES.length];
        const lighting2 = LIGHTING_OPTIONS[(page.page_number + 5) % LIGHTING_OPTIONS.length];
        const charDesc2 = characterProfile
          ? `A ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription} with ${characterProfile.hairDescription}, ${characterProfile.skinTone} skin, ${characterProfile.eyeColor} eyes, wearing ${storyOutfit}. ${characterProfile.gender === "female" ? "GIRL — feminine/neutral clothing only, no kippah/tzitzit." : "BOY — masculine clothing only, NO dress, skirt, tutu, flower crown, bow, makeup, or feminine accessories."}`
          : `A child wearing ${storyOutfit}`;
        const sceneBlock2 = pageNarrative
          ? `SCENE (MUST MATCH THE STORY TEXT EXACTLY — illustrate precisely what happens in this page, not a different action):
STORY TEXT FOR THIS PAGE: "${pageNarrative}"
VISUAL DESCRIPTION: ${secondPrompt}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above. Do not invent a different scene.`
          : `SCENE (MUST MATCH TEXT EXACTLY): ${secondPrompt}`;
        const secondIllustrationPrompt = `${charDesc2}. ${sceneBlock2}. CAMERA: ${cameraAngle2}. LIGHTING: ${lighting2}. Pixar 3D CGI style, vibrant colors, fantasy children's book, full body head to toe`;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          if (childPhotoSignedUrl) {
            secondImage = await generateIllustrationWithFace(
              secondIllustrationPrompt, childPhotoSignedUrl, characterProfile,
              storyOutfit, visualAnchor, effectiveAdventureLogic,
              coverReferenceUrl,
            );
            // No Flux fallback when childPhoto exists — loop retries Gemini instead
          } else {
            secondImage = await generateIllustrationGeminiNoFace(
              secondIllustrationPrompt, characterProfile,
              storyOutfit, visualAnchor, effectiveAdventureLogic,
              coverReferenceUrl,
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
            console.log(`[Page ${page.page_number}] ✅ SECOND illustration saved`);
          }
        } else {
          console.warn(`[Page ${page.page_number}] Second illustration failed`);
        }
      }

      return illustrationUrl;
    }

    // === TWO-PHASE GENERATION FOR CHARACTER CONSISTENCY ===
    // Phase 1: generate page 1 first (in parallel with the topic cover, which is independent).
    // Phase 2: generate pages 2+ in parallel, passing page 1's finished illustration as an
    //          additional visual reference so Gemini locks the character's exact appearance.
    // For single-page mode (re-generating one page that isn't page 1), fetch the existing
    // page 1 illustration from the DB and use it as the reference.
    const sortedPages = [...pagesToIllustrate].sort((a, b) => a.page_number - b.page_number);
    const firstPage = sortedPages.find(p => p.page_number === 1) || null;
    const restPages = sortedPages.filter(p => p !== firstPage);

    const coverPromise = TOPIC_COVER_PROMPTS[topic]
      ? generateCoverImage(supabase, storyId, LOVABLE_API_KEY, topic)
      : Promise.resolve(null);

    let coverReferenceForRest: string | null = null;

    // If single-page mode and the page isn't page 1, look up page 1's existing illustration
    if (!firstPage && restPages.length > 0) {
      const { data: existingFirst } = await supabase
        .from("story_pages")
        .select("illustration_url")
        .eq("story_id", storyId)
        .eq("page_number", 1)
        .maybeSingle();
      coverReferenceForRest = buildPublicIllustrationUrl(existingFirst?.illustration_url || null);
      if (coverReferenceForRest) {
        console.log(`🔗 Single-page re-gen: using existing page-1 illustration as character reference`);
      }
    }

    // Phase 1: page 1 + topic cover in parallel
    const [coverResult, firstResult] = await Promise.all([
      coverPromise,
      firstPage ? generatePageIllustration(firstPage, null) : Promise.resolve(null),
    ]);
    if (coverResult) console.log(`✅ Cover generated for topic "${topic}": ${coverResult}`);

    // After page 1 succeeds, use its uploaded illustration as reference for pages 2+
    if (firstPage && firstResult && !coverReferenceForRest) {
      coverReferenceForRest = buildPublicIllustrationUrl(firstResult);
      if (coverReferenceForRest) {
        console.log(`🔗 Phase 2: using page-1 illustration as character reference for ${restPages.length} remaining pages`);
      } else {
        console.warn(`⚠️ Phase 2: page 1 illustration URL unavailable — pages 2+ will generate without cover reference`);
      }
    }

    // Phase 2: pages 2+ in parallel, with page-1 reference
    const restResults = await Promise.all(
      restPages.map(page => generatePageIllustration(page, coverReferenceForRest)),
    );
    const illustrationResults = [firstResult, ...restResults].filter(r => r !== null || firstPage);
    console.log(`All ${pagesToIllustrate.length} illustration tasks completed. Success: ${illustrationResults.filter(Boolean).length}/${pagesToIllustrate.length}`);

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
