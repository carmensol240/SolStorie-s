import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  PIXAR_STYLE,
  NEGATIVE_PROMPT,
  NEGATIVE_PROMPT_FULL,
  CAST_NEGATIVE_PROMPT,
  CHARACTER_BASE_REFS,
  getSolUrl,
  CHARACTER_CONSISTENCY_PROMPT,
  GENDER_SYMBOL_RESTRICTION,
  buildGenderHeader,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Deterministic seed per story — keeps the seed-capable fallback (Flux Schnell)
// stable across every page of the same story.
function seedFromStoryId(storyId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < storyId.length; i++) {
    hash ^= storyId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 2147483647;
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

    const { storyId, pageId, customPrompt, mode, choice } = await req.json();
    console.log(`[retry-illustration] request story=${storyId} page=${pageId} mode=${mode ?? "default"} choice=${choice ?? "-"} user=${user.id}`);
    if (!storyId || !pageId) {
      return new Response(JSON.stringify({ error: "Missing storyId or pageId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, user_id, child_id, child_photo_path, child_gender, age_range, child_name, topic, page1_regen_used, page1_regen_lock_at")
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

    // ===== Page-1 one-shot regeneration =====
    // Page 1 doubles as the book cover, so users get exactly ONE redo attempt.
    // The flag `page1_regen_used` is only flipped AFTER the new image is safely in
    // storage — a failed generation leaves it false so the user can try again.
    const isPage1Regen = mode === "page1_regen" || mode === "page1_confirm";
    const candidatePath = `${storyId}/page-1-candidate.png`;
    const finalPage1Path = `${storyId}/page-1.png`;
    const publicUrl = (path: string) =>
      supabase.storage.from("story-illustrations").getPublicUrl(path).data.publicUrl;

    if (isPage1Regen && page.page_number !== 1) {
      return new Response(JSON.stringify({ error: "mode is only valid for page 1" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2 of the flow: user picked which version to keep.
    if (mode === "page1_confirm") {
      if (choice === "new") {
        const { data: blob, error: dlErr } = await supabase.storage
          .from("story-illustrations").download(candidatePath);
        if (dlErr || !blob) {
          return new Response(JSON.stringify({ error: "Candidate image not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from("story-illustrations")
          .upload(finalPage1Path, bytes, { contentType: "image/png", upsert: true });
        if (upErr) {
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Page 1 IS the cover — keep both pointers identical.
        await supabase.from("story_pages").update({ illustration_url: finalPage1Path }).eq("id", pageId);
        await supabase.from("stories")
          .update({ cover_url: `${publicUrl(finalPage1Path)}?v=${Date.now()}` })
          .eq("id", storyId);
      }
      await supabase.storage.from("story-illustrations").remove([candidatePath]).catch(() => {});
      return new Response(
        JSON.stringify({ success: true, illustrationUrl: finalPage1Path, kept: choice === "new" ? "new" : "old" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let lockAcquired = false;
    if (mode === "page1_regen") {
      if ((story as any).page1_regen_used) {
        return new Response(JSON.stringify({ error: "already_used" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Atomic double-click guard. Each conditional UPDATE is atomic on its own,
      // so only ONE concurrent request can win. We run two typed-filter updates
      // instead of a raw `.or()` string (which breaks on the ISO timestamp's
      // reserved characters): first "no lock", then "stale lock" (>3 minutes).
      const staleBefore = new Date(Date.now() - 3 * 60_000).toISOString();
      const tryLock = async (variant: "free" | "stale") => {
        let q = supabase
          .from("stories")
          .update({ page1_regen_lock_at: new Date().toISOString() })
          .eq("id", storyId)
          .eq("user_id", user.id)
          .eq("page1_regen_used", false);
        q = variant === "free"
          ? q.is("page1_regen_lock_at", null)
          : q.lt("page1_regen_lock_at", staleBefore);
        return await q.select("id");
      };

      let { data: locked, error: lockError } = await tryLock("free");
      if (!lockError && (!locked || locked.length === 0)) {
        ({ data: locked, error: lockError } = await tryLock("stale"));
      }

      if (lockError) {
        // A failed query is NOT "someone else is running" — surface it instead of
        // masking it behind a misleading 409.
        console.error(`[page1_regen] lock query failed story=${storyId}:`, lockError);
        return new Response(JSON.stringify({ error: "lock_failed", details: lockError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!locked || locked.length === 0) {
        console.warn(`[page1_regen] lock not acquired (another run in progress) story=${storyId}`);
        return new Response(JSON.stringify({ error: "in_progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lockAcquired = true;
    }

    const releaseLock = async () => {
      if (lockAcquired) {
        await supabase.from("stories").update({ page1_regen_lock_at: null }).eq("id", storyId);
        lockAcquired = false;
      }
    };

    const failure = async (message: string, status = 500) => {
      await releaseLock(); // generation failed → flag stays false, user may retry
      return new Response(JSON.stringify({ error: message }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    // Get child photo if available.
    // Lookup chain — a name-only match breaks whenever the story's child name differs
    // from any saved child profile, which silently killed the face reference on retries.
    //   1. the exact reference path stored on the story at creation time
    //   2. the linked child row (by id)
    //   3. a child row matching the story's child name (legacy behaviour)
    //   4. the photo saved on the user's profile
    let childPhoto: string | null = null;
    let photoSource = "none";
    let photoPath: string | null = (story as any).child_photo_path || null;
    if (photoPath) photoSource = "story";

    if (!photoPath && (story as any).child_id) {
      const { data: childById } = await supabase
        .from("children")
        .select("avatar_url, photo_url")
        .eq("id", (story as any).child_id)
        .eq("user_id", user.id)
        .maybeSingle();
      photoPath = childById?.photo_url || childById?.avatar_url || null;
      if (photoPath) photoSource = "child_id";
    }

    if (!photoPath) {
      const { data: child } = await supabase
        .from("children")
        .select("avatar_url, photo_url")
        .eq("user_id", user.id)
        .eq("name", story.child_name)
        .maybeSingle();
      photoPath = child?.photo_url || child?.avatar_url || null;
      if (photoPath) photoSource = "name";
    }

    if (!photoPath) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("child_photo_url, child_avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      photoPath = profile?.child_photo_url || profile?.child_avatar_url || null;
      if (photoPath) photoSource = "profile";
    }

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

    // Page-1 illustration is the canonical look of the character. Reuse it whenever the
    // page being retried is NOT page 1, so the regenerated art matches the rest of the book.
    // When regenerating page 1 itself, the CURRENT page-1 art is the canonical look of the
    // character — it must be used as the reference so the redo keeps the same child.
    let pageOneReferenceUrl: string | null = null;
    {
      const { data: firstPage } = await supabase
        .from("story_pages")
        .select("illustration_url")
        .eq("story_id", storyId)
        .eq("page_number", 1)
        .maybeSingle();
      const raw = (firstPage as { illustration_url?: string } | null)?.illustration_url;
      if (raw) {
        pageOneReferenceUrl = raw.startsWith("http")
          ? raw.split("?")[0]
          : supabase.storage.from("story-illustrations").getPublicUrl(raw).data?.publicUrl || null;
      }
      console.log(`🔗 page-1 character reference: ${pageOneReferenceUrl ? "found" : "not available"}`);
    }

    const prompt = customPrompt || page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
    const pageNarrative = ((page as any).text || "").toString().slice(0, 400);
    const genderHeader = buildGenderHeader((story as any).child_gender);
    const sceneBlockRaw = pageNarrative
      ? `SCENE (MUST MATCH THE STORY TEXT EXACTLY — illustrate precisely what happens in this page, not a different action):
STORY TEXT FOR THIS PAGE: "${pageNarrative}"
VISUAL DESCRIPTION: ${prompt}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above. Do not invent a different scene.`
      : `SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${prompt}`;
    // Page 1 is also used as the library cover card (square/landscape crop), so it needs a
    // safe composition: character centered, generous margins, headroom for title overlays.
    const COVER_SAFE_ZONE = `COMPOSITION (COVER SAFE ZONE): The main character is centered in the frame, full body visible, with at least 15% empty margin on every side and extra headroom at the top. Nothing important touches the edges — this image is also cropped to a square cover card.`;
    const sceneBlock = `${genderHeader}\n\n${sceneBlockRaw}\n\n${page.page_number === 1 ? `${COVER_SAFE_ZONE}\n\n` : ""}${GENDER_SYMBOL_RESTRICTION}`;

    let imageUrl: string | null = null;
    let modelUsed = "unknown";
    let fallbackReason: string | undefined;
    const MAX_ATTEMPTS = 2;
    const genStart = Date.now();
    const fluxSeed = seedFromStoryId(storyId);

    const logImageGenCall = (api: string, model: string, prompt: string, seed: number | null) =>
      console.log(
        `[IMG-GEN] story=${storyId} page=${page.page_number} api=${api} model=${model} ` +
          `refs=[face:${childPhoto ? "yes" : "no"}, page1:${pageOneReferenceUrl ? "yes" : "no"}] ` +
          `seed=${seed ?? "n/a"} promptChars=${prompt.length} promptHead="${prompt.substring(0, 200).replace(/\s+/g, " ")}"`,
      );

    // Branch: use Gemini Image Generation when child photo exists, Schnell otherwise
    if (childPhoto) {
      console.log(`Retrying illustration via Gemini Image Generation (face reference) for story ${storyId}, page ${page.page_number}...`);

      const personalizedPrompt = `FACE REFERENCE (FIRST IMAGE): The main character's face MUST be an EXACT 3D Pixar rendering of the child in the first reference photo. Keep all facial features, hair color, hair texture, and skin tone identical.
${pageOneReferenceUrl ? `\nCHARACTER CANON REFERENCE (SECOND IMAGE): The second image is a finished illustration of the SAME character from page 1 of this book. Match it EXACTLY — identical hair color/texture/length, eye color, apparent age, skin tone, outfit and rendering style. Only the pose, action and background change.\n` : ""}

STYLE: ${PIXAR_STYLE}

${sceneBlock}

${CHARACTER_CONSISTENCY_PROMPT}

NEGATIVE: ${NEGATIVE_PROMPT}`;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Gemini Image Generation attempt ${attempt}/${MAX_ATTEMPTS}...`);
          logImageGenCall("lovable-gateway/chat-completions", "google/gemini-3-pro-image-preview", personalizedPrompt, null);
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
                  { type: "image_url", image_url: { url: childPhoto } },
                  ...(pageOneReferenceUrl ? [{ type: "image_url", image_url: { url: pageOneReferenceUrl } }] : []),
                  { type: "text", text: personalizedPrompt },
                ],
              }],
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "no body");
            console.error(`Gemini attempt ${attempt} failed: ${response.status} - ${errorBody}`);
            fallbackReason = `Gemini with face failed: HTTP ${response.status}`;
            if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
            break;
          }

          const data = await response.json();
          imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

          if (imageUrl) {
            modelUsed = "gemini_with_face";
            console.log(`Gemini illustration generated successfully on attempt ${attempt}`);
            break;
          }
          console.warn(`Gemini attempt ${attempt}: no image in response`);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
        } catch (fetchErr) {
          console.error(`Gemini attempt ${attempt} error:`, fetchErr);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 3000)); continue; }
        }
      }
    }

    // Fallback to Schnell if no photo or Gemini failed
    if (!imageUrl) {
      if (!fallbackReason && !childPhoto) {
        fallbackReason = "No child photo available";
      }
      const FAL_KEY = Deno.env.get("FAL_KEY");
      if (!FAL_KEY) {
        return await failure("FAL_KEY not configured");
      }
      const fullPrompt = `${PIXAR_STYLE}\n\n${sceneBlock}\n\n${CHARACTER_CONSISTENCY_PROMPT}\n\nNEGATIVE: ${NEGATIVE_PROMPT_FULL}`;
      console.log(`Retrying illustration via Flux Schnell for story ${storyId}, page ${page.page_number}...`);

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Schnell attempt ${attempt}/${MAX_ATTEMPTS}...`);
          logImageGenCall("fal.run/fal-ai/flux/schnell", "flux-schnell", fullPrompt, fluxSeed);
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
              seed: fluxSeed,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text().catch(() => "no body");
            console.error(`Schnell attempt ${attempt} failed: ${response.status} - ${errorBody}`);
            if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
            return await failure("Image generation failed");
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
            if (imageUrl) {
              modelUsed = "fal_schnell_fallback";
              break;
            }
          }
          console.warn(`Schnell attempt ${attempt}: no image`);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        } catch (fetchErr) {
          console.error(`Schnell attempt ${attempt} error:`, fetchErr);
          if (attempt < MAX_ATTEMPTS) { await new Promise(r => setTimeout(r, 1000)); continue; }
        }
      }
    }
    const durationMs = Date.now() - genStart;
    console.log(`[IMG-GEN-RESULT] story=${storyId} page=${page.page_number} success=${!!imageUrl} model=${modelUsed} durationMs=${durationMs}${fallbackReason ? ` reason="${fallbackReason}"` : ""}`);

    if (!imageUrl) {
      return await failure("No image generated after retries");
    }

    // Upload to storage
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // In one-shot page-1 mode the new art lands on a candidate path first, so the user can
    // compare it with the original before anything is overwritten.
    const filePath = mode === "page1_regen" ? candidatePath : `${storyId}/page-${page.page_number}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return await failure("Upload failed");
    }

    if (mode === "page1_regen") {
      // Image is safely stored → NOW the one-shot attempt counts as used.
      await supabase
        .from("stories")
        .update({ page1_regen_used: true, page1_regen_lock_at: null })
        .eq("id", storyId);
      lockAcquired = false;
    } else {
      await supabase
        .from("story_pages")
        .update({ illustration_url: filePath })
        .eq("id", pageId);
    }

    // Log the illustration generation
    await supabase.from("illustration_logs").insert({
      story_id: storyId,
      page_number: page.page_number,
      model_used: modelUsed,
      fallback_reason: fallbackReason || null,
      had_face_reference: !!childPhoto,
      duration_ms: durationMs,
    });

    console.log(`✅ Retry illustration success for page ${page.page_number} (model: ${modelUsed})`);

    return new Response(
      JSON.stringify({
        success: true,
        illustrationUrl: filePath,
        ...(mode === "page1_regen"
          ? { candidateUrl: `${publicUrl(candidatePath)}?v=${Date.now()}`, regenUsed: true }
          : {}),
      }),
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
