import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  NEGATIVE_PROMPT,
  GENDER_SYMBOL_RESTRICTION,
  CHARACTER_CONSISTENCY_PROMPT,
  PIXAR_STYLE,
  buildGenderHeader,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Upload base64 image to storage and update story cover_url ──
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

// ── Call Gemini image generation with retries ──
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

// ── Resolve an illustration_url to a full HTTP URL ──
async function resolveIllustrationUrl(
  supabase: ReturnType<typeof createClient>,
  illustrationUrl: string,
): Promise<string | null> {
  if (!illustrationUrl) return null;

  // Already a full URL
  if (illustrationUrl.startsWith("http")) {
    // Strip any query params (cache busters) and return
    return illustrationUrl.split("?")[0];
  }

  // It's a storage path — get the public URL (bucket is public)
  const { data } = supabase.storage.from("story-illustrations").getPublicUrl(illustrationUrl);
  return data?.publicUrl || null;
}

// ── Wait (bounded) for page 1's illustration so the cover can reuse it as the
//    canonical look of the character (same hair, eyes, age, outfit as inner pages). ──
async function waitForPageOneIllustration(
  supabase: ReturnType<typeof createClient>,
  storyId: string,
  maxWaitMs = 60_000,
  intervalMs = 3_000,
): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs;
  let attempts = 0;
  while (Date.now() < deadline) {
    attempts++;
    const { data } = await supabase
      .from("story_pages")
      .select("illustration_url")
      .eq("story_id", storyId)
      .eq("page_number", 1)
      .maybeSingle();
    const raw = (data as { illustration_url?: string } | null)?.illustration_url;
    if (raw) {
      const url = await resolveIllustrationUrl(supabase, raw);
      if (url) {
        console.log(`🔗 [ref-wait] story=${storyId} page-1 illustration ready after ${attempts} check(s)`);
        return url;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.warn(`⚠️ [ref-wait] story=${storyId} page-1 illustration NOT ready after ${maxWaitMs}ms — cover falls back to face reference only`);
  return null;
}

// ── Resolve a child photo (storage path / data URI / http URL) to an HTTP URL ──
async function resolveChildPhotoUrl(
  supabase: ReturnType<typeof createClient>,
  photo: string | null | undefined,
  userId: string | null,
): Promise<string | null> {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;

  if (photo.startsWith("data:")) {
    try {
      const base64Content = photo.split(",")[1] || photo;
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const tempPath = `temp-refs/${userId || "anon"}/${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("child-photos")
        .upload(tempPath, bytes, { contentType: "image/png", upsert: true });
      if (uploadErr) return null;
      const { data: signedData } = await supabase.storage
        .from("child-photos")
        .createSignedUrl(tempPath, 3600);
      return signedData?.signedUrl || null;
    } catch {
      return null;
    }
  }

  const { data: signedData } = await supabase.storage
    .from("child-photos")
    .createSignedUrl(photo, 3600);
  return signedData?.signedUrl || null;
}

// ── Build a structured character description block from saved avatar profile ──
function buildCharacterDescription(
  avatarDescriptionJson: string | null,
  gender: string | null,
  ageRange: string | null,
  storyOutfitOverride: string | null,
): string {
  const isFemale = (gender || "").toLowerCase() === "female";
  const genderWord = isFemale ? "girl" : "boy";
  const genderRule = isFemale
    ? "This character is a GIRL — feminine or neutral clothing only; NEVER kippah, yarmulke, tzitzit or any male religious symbols."
    : "This character is a BOY — masculine clothing only (pants/shorts/t-shirt/hoodie/sneakers); ABSOLUTELY NO dress, skirt, tutu, flower crown, hair bow, makeup or any feminine clothing or accessories.";

  let hair = isFemale ? "long dark brown hair" : "short tousled dark brown hair";
  let clothingFromProfile: string | null = null;
  let skin = "warm medium olive";
  let eyes = "large warm brown";
  const age = ageRange || (isFemale ? "4" : "3-6");

  if (avatarDescriptionJson) {
    try {
      const p = JSON.parse(avatarDescriptionJson);
      if (p.hairDescription) hair = p.hairDescription;
      else if (p.hair_color || p.hair_style) hair = `${p.hair_color || "brown"} ${p.hair_style || "hair"}`;
      if (p.clothingDescription) clothingFromProfile = p.clothingDescription;
      else if (p.clothing_color || p.clothing_type) clothingFromProfile = `${p.clothing_color || "colorful"} ${p.clothing_type || "clothes"}`;
      if (p.skinTone || p.skin_tone) skin = p.skinTone || p.skin_tone;
      if (p.eyeColor || p.eye_color) eyes = p.eyeColor || p.eye_color;
    } catch {
      // ignore, use defaults
    }
  }

  // Prefer the story-wide outfit (matches inner pages) over the avatar's saved clothing
  const clothing = storyOutfitOverride || clothingFromProfile || "colorful casual clothes";

  return `CHARACTER DESCRIPTION (the main character MUST look IDENTICAL to this in the cover):
A ${genderWord} aged ${age} with ${hair}, ${skin} skin, and ${eyes} eyes. Wearing ${clothing}.
${genderRule}`;
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
    const { storyId, title, topic, adventureLogic } = await req.json();

    if (!storyId) {
      return new Response(JSON.stringify({ error: "Missing storyId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Authentication & ownership check ──
    // Accept either: (a) service-role bearer for internal calls from generate-story,
    // or (b) an authenticated end user who owns the target story.
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!bearer) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const isServiceRole = bearer === supabaseServiceKey;
    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(bearer);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: ownerCheck } = await supabase
        .from("stories")
        .select("id")
        .eq("id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!ownerCheck) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`📋 Generating cover for story ${storyId}, topic: ${topic}, title: ${title}`);

    // ── Load story (for child + gender) ──
    const { data: story } = await supabase
      .from("stories")
      .select("child_id, child_name, child_gender, age_range, user_id")
      .eq("id", storyId)
      .maybeSingle();

    // ── Load child (for photo + structured avatar description) ──
    let childPhoto: string | null = null;
    let avatarUrl: string | null = null;
    let avatarDescription: string | null = null;
    if (story?.child_id) {
      const { data: child } = await supabase
        .from("children")
        .select("photo_url, avatar_url, avatar_description")
        .eq("id", story.child_id)
        .maybeSingle();
      childPhoto = child?.photo_url || null;
      avatarUrl = child?.avatar_url || null;
      avatarDescription = child?.avatar_description || null;
    } else if (story?.user_id && story?.child_name) {
      const { data: child } = await supabase
        .from("children")
        .select("photo_url, avatar_url, avatar_description")
        .eq("user_id", story.user_id)
        .eq("name", story.child_name)
        .maybeSingle();
      childPhoto = child?.photo_url || null;
      avatarUrl = child?.avatar_url || null;
      avatarDescription = child?.avatar_description || null;
    }

    // Prefer avatar_url (already a Pixar-style render), fall back to original photo
    const facePhoto = avatarUrl || childPhoto;
    const faceUrl = await resolveChildPhotoUrl(supabase, facePhoto, story?.user_id || null);
    if (faceUrl) {
      console.log(`🖼️ Face reference resolved (avatar=${!!avatarUrl}, photo=${!!childPhoto})`);
    } else {
      console.warn(`⚠️ No face reference available for story ${storyId} — cover will use description-only`);
    }

    // Compute storyOutfit the same way generate-illustrations does, so the cover
    // shows the SAME outfit as the inner pages.
    let profileClothing: string | null = null;
    if (avatarDescription) {
      try {
        const p = JSON.parse(avatarDescription);
        profileClothing = p?.clothingDescription || null;
      } catch { /* ignore */ }
    }
    const storyOutfit: string =
      (adventureLogic && typeof adventureLogic === "object" && (adventureLogic as any).outfit) ||
      profileClothing ||
      "colorful casual clothes";
    console.log(`🎽 Cover storyOutfit: "${storyOutfit}" (source: ${adventureLogic?.outfit ? "adventureLogic" : profileClothing ? "avatar_description" : "fallback"})`);

    const characterDescription = buildCharacterDescription(
      avatarDescription,
      story?.child_gender || null,
      story?.age_range || null,
      storyOutfit,
    );

    // ── Find the page with the longest illustration_prompt (for scene/outfit context) ──
    const { data: allPages } = await supabase
      .from("story_pages")
      .select("illustration_prompt, illustration_url, page_number")
      .eq("story_id", storyId)
      .not("illustration_prompt", "is", null)
      .not("illustration_url", "is", null)
      .order("page_number", { ascending: true });

    // Sort by prompt length descending to find the richest scene
    const bestPage = allPages
      ?.filter(p => p.illustration_prompt && p.illustration_url)
      ?.sort((a, b) => (b.illustration_prompt?.length || 0) - (a.illustration_prompt?.length || 0))
      ?.[0];

    // Wait for page 1's illustration — it is the canonical look of the character.
    const pageOneReferenceUrl = await waitForPageOneIllustration(supabase, storyId);

    const sceneContext = bestPage?.illustration_prompt
      ? bestPage.illustration_prompt.substring(0, 600)
      : (topic ? `A heroic moment from a children's story about ${topic}.` : "A magical heroic moment from the story.");

    console.log(`📋 Scene context source: ${bestPage ? `page #${bestPage.page_number}` : "topic-fallback"}`);

    // ── Build the cover prompt — face reference + structured character description ──
    const faceRefBlock = faceUrl
      ? `FACE REFERENCE (FIRST IMAGE): The main character's face MUST be an EXACT 3D Pixar rendering of the child in the FIRST reference photo. Keep all facial features, hair color, hair texture, and skin tone identical to the reference.`
      : "";

    const pageOneRefBlock = pageOneReferenceUrl
      ? `\n\nCHARACTER CANON REFERENCE (${faceUrl ? "SECOND" : "ATTACHED"} IMAGE): The ${faceUrl ? "second" : "attached"} image is a finished Pixar 3D illustration of the SAME main character from page 1 of THIS storybook. The character on the cover MUST MATCH that image EXACTLY — identical face shape, hair color, hair texture and length, eye color, apparent age, skin tone, outfit, and Pixar 3D rendering style. Treat it as the canonical look of this character. Only the pose, background and composition change; the character itself does not.`
      : "";

    const coverPrompt = `${buildGenderHeader(story?.child_gender || null)}

${faceRefBlock}${pageOneRefBlock}

${characterDescription}

STYLE: ${PIXAR_STYLE}

SCENE: A children's book COVER illustration showing the main character in a fresh, heroic moment inspired by this story: ${sceneContext}

COMPOSITION: Leave roughly 20% empty space at the TOP of the image for a title (do NOT add any text). Full-bleed Pixar 3D CGI illustration. Cinematic warm lighting, rich colorful background.

${CHARACTER_CONSISTENCY_PROMPT}

${GENDER_SYMBOL_RESTRICTION}

NEGATIVE: ${NEGATIVE_PROMPT}`;

    console.log(`📋 Cover prompt (first 300): ${coverPrompt.substring(0, 300)}...`);

    const coverStartTime = Date.now();

    const userContent: Array<Record<string, unknown>> = [];
    if (faceUrl) {
      userContent.push({ type: "image_url", image_url: { url: faceUrl } });
    }
    if (pageOneReferenceUrl) {
      userContent.push({ type: "image_url", image_url: { url: pageOneReferenceUrl } });
    }
    userContent.push({ type: "text", text: coverPrompt });

    const requestBody = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{ role: "user", content: userContent }],
    };

    console.log(
      `[IMG-GEN] story=${storyId} page=cover api=lovable-gateway/chat-completions ` +
        `model=google/gemini-3-pro-image-preview ` +
        `refs=[face:${faceUrl ? "yes" : "no"}, page1:${pageOneReferenceUrl ? "yes" : "no"}] ` +
        `seed=n/a promptChars=${coverPrompt.length} promptHead="${coverPrompt.substring(0, 200).replace(/\s+/g, " ")}"`,
    );

    const imageUrl = await callGeminiImage(LOVABLE_API_KEY, requestBody, 3, "cover");
    const durationMs = Date.now() - coverStartTime;
    console.log(`[IMG-GEN-RESULT] story=${storyId} page=cover success=${!!imageUrl} model=google/gemini-3-pro-image-preview durationMs=${durationMs}`);

    // Log cover generation
    try {
      await supabase.from("cover_logs").insert({
        story_id: storyId,
        selected_illustration_prompt: bestPage?.illustration_prompt?.substring(0, 1000) || null,
        had_face_reference: !!faceUrl,
        cast_character: null,
        topic_setting: null,
        story_context: bestPage ? `Reference page: ${bestPage.page_number}` : "topic-fallback",
        cover_path: faceUrl ? "face-reference+character-description" : "character-description-only",
        duration_ms: durationMs,
      });
    } catch (logErr) {
      console.warn("Cover log insert failed:", logErr);
    }

    if (!imageUrl) {
      console.error(`❌ Cover generation failed for story ${storyId} after retries`);
      return new Response(JSON.stringify({ error: "Cover generation failed after retries" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Cover generated for story ${storyId} (face_ref=${!!faceUrl}, scene_src=${bestPage ? `page#${bestPage.page_number}` : "topic"}, ${durationMs}ms)`);
    return uploadCoverAndSave(supabase, storyId, imageUrl);
  } catch (error) {
    console.error("generate-cover error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
