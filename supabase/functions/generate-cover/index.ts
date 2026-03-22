import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { NEGATIVE_PROMPT } from "../_shared/style-config.ts";

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
    const { storyId, title, topic } = await req.json();

    if (!storyId) {
      return new Response(JSON.stringify({ error: "Missing storyId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Generating cover for story ${storyId}, topic: ${topic}, title: ${title}`);

    // ── Find the page with the longest illustration_prompt ──
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

    if (!bestPage?.illustration_url) {
      console.error(`❌ No illustrated page found for story ${storyId}`);
      return new Response(JSON.stringify({ error: "No illustrated pages found to base cover on" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Best page: #${bestPage.page_number}, prompt length: ${bestPage.illustration_prompt?.length}, url: ${bestPage.illustration_url}`);

    // ── Resolve the illustration URL to a full HTTP URL ──
    const referenceImageUrl = await resolveIllustrationUrl(supabase, bestPage.illustration_url);
    if (!referenceImageUrl) {
      console.error(`❌ Could not resolve illustration URL: ${bestPage.illustration_url}`);
      return new Response(JSON.stringify({ error: "Could not resolve reference illustration URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Reference image URL: ${referenceImageUrl}`);

    // ── Build the cover prompt ──
    const coverPrompt = `Create a children's book COVER illustration in the EXACT SAME art style as the reference image — same color palette, same lighting, same Pixar 3D CGI quality. This is a DIFFERENT scene from the same story: use a different pose, different camera angle, and different composition than the reference. Leave 20% space at the top for the title. No text. Same character, same environment theme, but a fresh new moment.

NEGATIVE: ${NEGATIVE_PROMPT}`;

    console.log(`📋 Cover prompt: ${coverPrompt.substring(0, 300)}...`);

    const coverStartTime = Date.now();

    const requestBody = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: referenceImageUrl } },
          { type: "text", text: coverPrompt },
        ],
      }],
    };

    const imageUrl = await callGeminiImage(LOVABLE_API_KEY, requestBody, 3, "cover");
    const durationMs = Date.now() - coverStartTime;

    // Log cover generation
    try {
      await supabase.from("cover_logs").insert({
        story_id: storyId,
        selected_illustration_prompt: bestPage.illustration_prompt?.substring(0, 1000) || null,
        had_face_reference: false,
        cast_character: null,
        topic_setting: null,
        story_context: `Reference page: ${bestPage.page_number}`,
        cover_path: "illustration-reference",
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

    console.log(`✅ Cover generated for story ${storyId} (based on page ${bestPage.page_number}, ${durationMs}ms)`);
    return uploadCoverAndSave(supabase, storyId, imageUrl);
  } catch (error) {
    console.error("generate-cover error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
