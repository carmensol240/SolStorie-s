import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  // Richer defaults based on gender for better visual anchoring when no photo is provided
  const isFemale = childGender === "female";
  return {
    gender: childGender,
    genderHebrew: genderHebrew,
    hairDescription: isFemale ? "long wavy dark brown hair with soft bangs" : "short tousled dark brown hair",
    clothingDescription: "colorful casual clothes",
    ageDescription: ageRange,
    skinTone: "warm medium olive",
    eyeColor: "large dark brown",
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

// Helper function to generate illustration using Lovable AI with character consistency
// IMPORTANT: This function now enforces SAME OUTFIT across all pages of a story
// and uses a Visual Anchor for strict character continuity
async function generateIllustration(
  prompt: string,
  childPhoto: string | null,
  characterProfile: CharacterProfile | null,
  apiKey: string,
  storyOutfit: string, // The SINGLE outfit chosen for this entire story
  visualAnchor: string, // Pre-built visual anchor text for consistency
  adventureLogic?: { outfit: string; background: string; theme: string }
): Promise<string | null> {
  try {
    const characterSeed = characterProfile 
      ? `CHARACTER_SEED_${characterProfile.gender}_${characterProfile.hairDescription.replace(/\s+/g, '_')}_${characterProfile.skinTone}_${characterProfile.eyeColor}`.toUpperCase()
      : "";
    
    // Use the storyOutfit that was determined at the START of generation for ALL pages
    const finalOutfit = storyOutfit || adventureLogic?.outfit || characterProfile?.clothingDescription || "colorful casual clothes";
    
    const characterInstruction = characterProfile 
      ? `
=== 🔒 LOCKED CHARACTER PROFILE - NEVER MODIFY ACROSS ANY PAGE ===
CHARACTER SEED: ${characterSeed}

The main character is a ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription}.

MANDATORY APPEARANCE (IDENTICAL IN EVERY SINGLE PAGE):
- Gender: ${characterProfile.gender === "female" ? "Female girl" : "Male boy"}
- Hair: ${characterProfile.hairDescription} (EXACT color and style - NEVER change!)
- Skin: ${characterProfile.skinTone} skin tone (consistent across all lighting)
- Eyes: ${characterProfile.eyeColor} eyes
- Face: Same face shape, nose, and proportions throughout

=== 🎽 LOCKED OUTFIT FOR ENTIRE STORY ===
CLOTHING: ${finalOutfit}
⚠️ CRITICAL: The character wears THIS EXACT OUTFIT on EVERY page of the story.
The character does NOT change clothes during the story.
=== END LOCKED OUTFIT ===

⚠️ CRITICAL: This character MUST be visually IDENTICAL in every single illustration.
Same child, same face, same hair, same outfit - as if photographed from different angles.
Any deviation from this profile is a FAILURE.
=== END LOCKED PROFILE ===
`
      : "";
    
    const adventureInstruction = adventureLogic
      ? `
=== ADVENTURE THEME REQUIREMENTS ===
- Background/Setting: ${adventureLogic.background}
- Theme/Mood: ${adventureLogic.theme}
(Note: Character outfit is locked above and must not change)
=== END ADVENTURE THEME ===
`
      : "";
    
    const stylePrefix = `In the style of modern 3D Disney-Pixar animation, high resolution, magical atmosphere, magical glowing light, dreamy warm and inviting atmosphere. Characters with large expressive emotional eyes, detailed hair, soft textures.`;
    
    const enhancedPrompt = `${stylePrefix}

${visualAnchor}

${characterInstruction}
${adventureInstruction}
SCENE TO ILLUSTRATE: ${prompt}

STYLE REQUIREMENTS:
- Modern 3D Disney-Pixar animation style (like Coco, Encanto, Inside Out)
- Magical glowing light throughout the scene
- Dreamy, warm, and inviting atmosphere
- Characters with large, expressive emotional eyes
- Detailed hair with realistic textures and flow
- Soft, smooth character textures
- Rich, vibrant colors with warm undertones
- Professional children's book illustration quality
- No text in the image
- MAINTAIN STRICT VISUAL CHARACTER CONTINUITY: Same face shape, same features, same proportions, SAME OUTFIT across all pages`;

    const requestBody: any = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: childPhoto
            ? [
                { type: "text", text: `Based on this child's photo, create a HIGH QUALITY 3D Disney-Pixar style illustration of them in this scene: ${enhancedPrompt}. CRITICAL: Keep the character's FACE (hair color, hair style, skin tone, eye color, face shape) IDENTICAL to the reference photo. HOWEVER, IGNORE the clothing in the photo — the character MUST wear EXACTLY: ${finalOutfit}. Do NOT copy or reference the clothes from the photo. This MUST look like a premium children's book illustration.` },
                { type: "image_url", image_url: { url: childPhoto } }
              ]
            : enhancedPrompt
        }
      ]
    };

    console.log("Generating illustration...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log("Illustration generated successfully");
      return imageUrl;
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
    const { storyId, childPhoto, childAvatarUrl, childGender, ageRange, adventureLogic, userId, childName, topic } = requestBody;
    
    console.log("Request body received:", { 
      storyId, 
      hasChildPhoto: !!childPhoto, 
      hasChildAvatarUrl: !!childAvatarUrl,
      childGender,
      ageRange,
      hasAdventureLogic: !!adventureLogic,
      userId: userId ? userId.substring(0, 8) + "..." : "none",
      childName,
      topic
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
    const pagesToIllustrate = pages.filter(p => p.illustration_prompt);
    console.log(`${pagesToIllustrate.length} of ${pages.length} pages need illustrations (spread layout)`);
    
    const BATCH_SIZE = 2;
    let firstIllustrationUrl: string | null = null;

    for (let i = 0; i < pagesToIllustrate.length; i += BATCH_SIZE) {
      const batch = pagesToIllustrate.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: pages ${batch.map(p => p.page_number).join(', ')}`);

      const results = await Promise.allSettled(
        batch.map(async (page) => {
          console.log(`Generating illustration for page ${page.page_number}...`);
          
          // Auto-retry up to 3 times for each page
          let base64Image: string | null = null;
          const MAX_RETRIES = 3;
          
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            base64Image = await generateIllustration(
              page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`,
              effectivePhoto,
              characterProfile,
              LOVABLE_API_KEY,
              storyOutfit,
              visualAnchor,
              effectiveAdventureLogic
            );
            
            if (base64Image) {
              if (attempt > 1) console.log(`✅ Page ${page.page_number} succeeded on retry ${attempt}`);
              break;
            }
            
            console.warn(`⚠️ Page ${page.page_number} attempt ${attempt}/${MAX_RETRIES} failed, ${attempt < MAX_RETRIES ? 'retrying...' : 'giving up'}`);
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            }
          }

          if (!base64Image) return null;

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
              await supabase
                .from("stories")
                .update({ cover_url: illustrationUrl })
                .eq("id", storyId);
            }
          }
          return illustrationUrl;
        })
      );

      results.forEach((r, idx) => {
        const pg = batch[idx];
        if (r.status === 'fulfilled') {
          console.log(`Page ${pg.page_number}: ${r.value ? 'success' : 'no image'}`);
        } else {
          console.error(`Page ${pg.page_number} failed:`, r.reason);
        }
      });
    }

    // Update story status to ready
    const { error: statusError } = await supabase
      .from("stories")
      .update({ generation_status: "ready" })
      .eq("id", storyId);

    if (statusError) {
      console.error("Error updating story status:", statusError);
    }

    console.log(`Story ${storyId} illustrations completed!`);

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
