import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const { illustration_url, story_title, child_name, story_id, device_id } = await req.json();

    if (!illustration_url) {
      return jsonResponse({ error: "illustration_url is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require authentication — anonymous callers must not consume AI quota
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user?.id) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId: string = user.id;

    if (!story_id) {
      return jsonResponse({ error: "story_id is required" }, 400);
    }

    // Verify the story belongs to this user
    const { data: storyOwner } = await supabase
      .from("stories")
      .select("id")
      .eq("id", story_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!storyOwner) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // ── Cache check ──
    if (story_id && userId) {
      const { data: cached } = await supabase
        .from("story_coloring_pages")
        .select("*")
        .eq("story_id", story_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (cached) {
        // Same illustration → return cached
        if (cached.illustration_url === illustration_url) {
          console.log("Returning cached coloring page for story:", story_id);
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/story-illustrations/${cached.coloring_image_path}`;
          return jsonResponse({ image: publicUrl, cached: true, story_title, child_name });
        }

        // Different illustration → check coloring credits
        const { data: profile } = await supabase
          .from("profiles")
          .select("coloring_credits")
          .eq("id", userId)
          .maybeSingle();

        const credits = profile?.coloring_credits ?? 0;
        if (credits <= 0) {
          console.log("User wants different illustration but has no coloring credits");
          return jsonResponse({ upsell: true, error: "רוצים לצבוע איור נוסף? 🎨" });
        }

        // Deduct 1 credit
        await supabase
          .from("profiles")
          .update({ coloring_credits: credits - 1 })
          .eq("id", userId);
        console.log("Deducted 1 coloring credit, remaining:", credits - 1);

        // Delete old cache record so we can insert the new one
        await supabase
          .from("story_coloring_pages")
          .delete()
          .eq("id", cached.id);
      } else {
        // No cached page for this story → first generation requires a credit too
        const { data: profile } = await supabase
          .from("profiles")
          .select("coloring_credits")
          .eq("id", userId)
          .maybeSingle();

        const credits = profile?.coloring_credits ?? 0;
        if (credits <= 0) {
          console.log("User has no coloring credits for first generation");
          return jsonResponse({ upsell: true, error: "דף צביעה דורש קרדיט 🎨" });
        }

        // Deduct 1 credit for the first coloring page of this story
        await supabase
          .from("profiles")
          .update({ coloring_credits: credits - 1 })
          .eq("id", userId);
        console.log("Deducted 1 coloring credit (first page), remaining:", credits - 1);
      }
    }

    // ── AI generation via Lovable AI Gateway ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // Download the illustration image
    console.log("Downloading illustration:", illustration_url);
    const imgResponse = await fetch(illustration_url);
    if (!imgResponse.ok) {
      console.error("Failed to download illustration:", imgResponse.status);
      return jsonResponse({ error: "Failed to download illustration" }, 400);
    }

    const imgBuffer = await imgResponse.arrayBuffer();
    const imgBase64 = btoa(
      new Uint8Array(imgBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = imgResponse.headers.get("content-type") || "image/png";

    const coloringPrompt = `Convert this illustration into a perfect children's coloring book page for printing. Follow these rules strictly:

1. OUTLINES: Use very thick, bold, solid black outlines (minimum 3-4px weight). Every shape must have a clearly defined closed boundary.
2. CLOSED REGIONS: Every colored area MUST be completely enclosed by black outlines with no gaps whatsoever. Sky, ground, trees, clothing and all elements must be separated by continuous unbroken black lines. No area should bleed into another area. Test: flood-fill from any point should not leak into adjacent regions.
3. SIMPLICITY: Create large, simple areas for coloring. Merge small details into bigger shapes. A 3-year-old should be able to color inside the lines.
4. STYLE: Disney/Pixar cartoon style with rounded, friendly shapes. Keep the character recognizable but simplified.
5. NO SHADING: Absolutely no shadows, gradients, cross-hatching, stippling, or any form of shading. Pure black outlines on pure white background only.
6. NO 3D DEPTH: Flatten all 3D elements into simple 2D cartoon outlines.
7. MINIMAL DETAILS: Remove textures, patterns, small decorative elements. Keep only the essential shapes of the character and main objects.
8. RESOLUTION: Output a high-resolution image (at least 2400x3200 pixels) suitable for 300 DPI A4 printing.
9. BACKGROUND: Pure white (#FFFFFF) background with no marks or artifacts.

Output ONLY the coloring page image, nothing else. Do not include any text, labels, letter names, or written words anywhere in the image.`;

    console.log("Sending to Lovable AI Gateway for coloring page conversion...");

    const imageModels = [
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-2.5-flash-image",
    ];

    let generatedImage: string | undefined;
    let lastError = "";

    for (const model of imageModels) {
      console.log(`Trying model: ${model}`);

      const maxRetries = 3;
      let aiResponse: Response | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: coloringPrompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType};base64,${imgBase64}` },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (aiResponse.ok) break;

        const retryableStatus = aiResponse.status === 429 || aiResponse.status === 502 || aiResponse.status === 503;
        if (!retryableStatus || attempt === maxRetries) break;

        const backoffSeconds = Math.min(20, 3 * (2 ** attempt));
        console.log(`Retryable error ${aiResponse.status} (attempt ${attempt + 1}), waiting ${backoffSeconds}s...`);
        await new Promise((r) => setTimeout(r, backoffSeconds * 1000));
      }

      if (!aiResponse!.ok) {
        lastError = await aiResponse!.text();
        console.error(`Model ${model} failed:`, aiResponse!.status, lastError.slice(0, 300));
        continue;
      }

      // Parse response - check images array first (Lovable Gateway format)
      const aiData = await aiResponse!.json();
      const choice = aiData.choices?.[0];
      const message = choice?.message;

      // Gateway returns images in message.images[]
      if (Array.isArray(message?.images)) {
        for (const img of message.images) {
          if (img.image_url?.url) {
            generatedImage = img.image_url.url;
            break;
          }
        }
      }

      // Fallback: check message.content
      if (!generatedImage) {
        const content = message?.content;
        if (typeof content === "string" && content.startsWith("data:image")) {
          generatedImage = content;
        } else if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === "image_url" && part.image_url?.url) {
              generatedImage = part.image_url.url;
              break;
            }
          }
        }
      }

      if (generatedImage) {
        console.log(`Coloring page generated successfully with model: ${model}`);
        break;
      } else {
        console.error(`Model ${model} returned no image. Response:`, JSON.stringify(aiData).slice(0, 500));
      }
    }

    if (!generatedImage) {
      if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED") || lastError.includes("rate")) {
        return jsonResponse({ error: "השירות עמוס כרגע, נסו שוב בעוד כמה דקות 🎨", retryable: true });
      }
      return jsonResponse({ error: "שגיאה ביצירת דף הצביעה" }, 500);
    }

    console.log("Coloring page generated successfully");

    // ── Upload to storage & cache ──
    if (story_id && userId) {
      try {
        const base64Match = generatedImage.match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          const raw = base64Match[1];
          const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
          const storagePath = `coloring/${story_id}.png`;

          const { error: uploadErr } = await supabase.storage
            .from("story-illustrations")
            .upload(storagePath, bytes, { contentType: "image/png", upsert: true });

          if (uploadErr) {
            console.error("Failed to upload coloring page to storage:", uploadErr);
          } else {
            await supabase.from("story_coloring_pages").insert({
              story_id,
              user_id: userId,
              illustration_url,
              coloring_image_path: storagePath,
            });
            console.log("Coloring page cached at:", storagePath);
          }
        }
      } catch (cacheErr) {
        console.error("Failed to cache coloring page:", cacheErr);
      }
    }

    // ── Track analytics ──
    try {
      await supabase.from("analytics_events").insert({
        device_id: device_id || "unknown",
        event_type: "coloring_page_generated",
        story_id: story_id || null,
        metadata: {
          story_title: story_title || null,
          child_name: child_name || null,
          user_id: userId,
          model_used: "lovable-gateway",
        },
      });
    } catch (trackErr) {
      console.error("Failed to track coloring generation:", trackErr);
    }

    return jsonResponse({ image: generatedImage, story_title, child_name });
  } catch (err) {
    console.error("generate-coloring-page error:", err);
    return jsonResponse({ error: "שגיאה פנימית" }, 500);
  }
});
