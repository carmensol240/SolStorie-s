import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { isLegacyOpenStory } from "../_shared/legacy-access.ts";
import { mergeAppearance, hairToEnglish, clothingToEnglish, buildCharacterLock, kippahForStory } from "../_shared/appearance.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { COLORING_FAILED_MESSAGE, COLORING_RETRY_INSTRUCTION, produceCleanColoringPage } from "../_shared/coloring-pipeline.ts";

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
      console.warn("Coloring: missing auth header");
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user?.id) {
      console.warn("Coloring: invalid session", authErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId: string = user.id;

    if (!story_id) {
      return jsonResponse({ error: "story_id is required" }, 400);
    }

    // Verify the story belongs to this user
    const { data: storyOwner } = await supabase
      .from("stories")
      .select("id, child_id, child_name, child_gender, age_range, user_id, is_taste, created_at, story_outfit, kippah, kippah_color")
      .eq("id", story_id)
      .maybeSingle();
    if (!storyOwner) {
      console.warn("Coloring: story not found", story_id);
      return jsonResponse({ error: "Story not found" }, 404);
    }
    if (storyOwner.user_id !== userId) {
      // Admins (not in demo view mode) may make pages for any story; saved under the story owner.
      const { data: adminOk } = await supabase.rpc("is_effective_admin", { _user_id: userId });
      if (!adminOk) {
        console.warn("Coloring: forbidden, not owner", { story_id, userId });
        return jsonResponse({ error: "Forbidden" }, 403);
      }
    }
    const ownerId: string = storyOwner.user_id;

    // ── Access: every purchased story opens all of its coloring pages (no credits) ──
    const [{ data: unlock }, { data: isAdmin }] = await Promise.all([
      supabase.from("story_unlocks").select("id").eq("story_id", story_id).eq("user_id", ownerId).maybeSingle(),
      supabase.rpc("is_effective_admin", { _user_id: userId }),
    ]);
    if (!unlock && !isAdmin && !isLegacyOpenStory(storyOwner, ownerId)) {
      return jsonResponse({ upsell: true, error: "דפי הצביעה נפתחים עם רכישת הסיפור 🎨" });
    }

    // ── Cache: one saved coloring page per illustration ──
    const { data: cachedRows } = await supabase
      .from("story_coloring_pages")
      .select("*")
      .eq("story_id", story_id)
      .eq("user_id", ownerId)
      .eq("illustration_url", illustration_url)
      .order("created_at", { ascending: false })
      .limit(1);
    const cached = cachedRows?.[0];
    if (cached) {
      console.log("Returning cached coloring page for story:", story_id);
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/story-illustrations/${cached.coloring_image_path}`;
      return jsonResponse({ image: publicUrl, cached: true, story_title, child_name });
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

    // Same fixed character description as the story illustrations.
    let characterLock = "";
    try {
      let q = supabase.from("children").select("age, hair_color, hair_style, clothing_type, clothing_color").eq("user_id", userId);
      q = (storyOwner as any).child_id ? q.eq("id", (storyOwner as any).child_id) : q.eq("name", (storyOwner as any).child_name);
      const { data: ch } = await q.limit(1).maybeSingle();
      const ap = mergeAppearance(null, { hairColor: ch?.hair_color, hairStyle: ch?.hair_style, clothingType: ch?.clothing_type, clothingColor: ch?.clothing_color });
      const hair = hairToEnglish(ap);
      const outfit = clothingToEnglish(ap, (storyOwner as any).child_gender) || (storyOwner as any).story_outfit || "";
      const kp = kippahForStory(storyOwner as any);
      if (hair || outfit || kp.kippah) {
        characterLock = buildCharacterLock({ gender: (storyOwner as any).child_gender, age: ch?.age ?? null, ageRange: (storyOwner as any).age_range, hair, outfit, kippah: kp.kippah, kippahColor: kp.color });
      }
    } catch (e) { console.warn("character lock lookup failed", e); }

    const coloringPrompt = `Convert this illustration into a perfect children's coloring book page for printing. Follow these rules strictly:

1. OUTLINES: Clean, even black outlines of medium weight (about 2-3px). Every shape must have a clearly defined closed boundary. NEVER fill any area with black: hair, shadows, clothing, eyes' surroundings and dark objects are drawn as outlines with white inside.
2. CLOSED REGIONS: Every colored area MUST be completely enclosed by black outlines with no gaps whatsoever. Sky, ground, trees, clothing and all elements must be separated by continuous unbroken black lines. No area should bleed into another area. Test: flood-fill from any point should not leak into adjacent regions.
3. SIMPLICITY: Create large, simple areas for coloring. Merge small details into bigger shapes. A 3-year-old should be able to color inside the lines.
4. STYLE: Disney/Pixar cartoon style with rounded, friendly shapes. Keep the character recognizable but simplified.
5. NO SHADING: Absolutely no shadows, gradients, cross-hatching, stippling, or any form of shading. Pure black outlines on pure white background only.
6. NO 3D DEPTH: Flatten all 3D elements into simple 2D cartoon outlines.
7. MINIMAL DETAILS: Remove textures, patterns, small decorative elements. Keep only the essential shapes of the character and main objects.
8. RESOLUTION: Output a high-resolution image (at least 2400x3200 pixels) suitable for 300 DPI A4 printing.
9. BACKGROUND: Pure white (#FFFFFF) background with no marks or artifacts.

10. LAYOUT: full-page portrait composition in A4 proportions, the illustration fills the whole page from edge to edge, pure white background, clean black outlines, no gray shading, no solid black areas, no text.

${characterLock ? `11. CHARACTER: Keep the main character recognizable. ${characterLock}\n\n` : ""}Output ONLY the coloring page image, nothing else. Do not include any text, labels, letter names, or written words anywhere in the image.`;

    console.log("Sending to Lovable AI Gateway for coloring page conversion...");

    const imageModels = [
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-2.5-flash-image",
    ];

    let lastError = "";
    const generateImage = async (prompt: string): Promise<string | undefined> => {
    let generatedImage: string | undefined;

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
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType};base64,${imgBase64}` },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
            image_config: { aspect_ratio: "2:3" },
          }),
        });

        if (aiResponse.ok) break;

        const retryableStatus = aiResponse.status === 429 || aiResponse.status === 502 || aiResponse.status === 503;
        if (!retryableStatus || attempt === maxRetries) break;

        const backoffSeconds = Math.min(20, 3 * (2 ** attempt));
        console.log(`Retryable error ${aiResponse.status} (attempt ${attempt + 1}), waiting ${backoffSeconds}s...`);
        await new Promise((r) => setTimeout(r, backoffSeconds * 1000));
      }

      if (!aiResponse) continue;
      if (!aiResponse.ok) {
        lastError = await aiResponse.text();
        console.error(`Model ${model} failed:`, aiResponse.status, lastError.slice(0, 300));
        continue;
      }

      // Parse response - check images array first (Lovable Gateway format)
      const aiData = await aiResponse.json();
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

    return generatedImage;
    };
    let generatedImage = await generateImage(coloringPrompt);

    if (!generatedImage) {
      if (lastError.includes("429") || lastError.includes("RESOURCE_EXHAUSTED") || lastError.includes("rate")) {
        return jsonResponse({ error: "השירות עמוס כרגע, נסו שוב בעוד כמה דקות 🎨", retryable: true });
      }
      return jsonResponse({ error: "שגיאה ביצירת דף הצביעה" }, 500);
    }

    const imageBytes = async (url: string): Promise<Uint8Array> => {
      const match = url.match(/^data:image\/[^;]+;base64,(.+)$/s);
      if (match) return Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
      const response = await fetch(url);
      if (!response.ok) throw new Error("Generated image download failed");
      return new Uint8Array(await response.arrayBuffer());
    };
    const finalBytes = await produceCleanColoringPage({
      first: generatedImage,
      regenerate: () => generateImage(`${coloringPrompt}\n\n${COLORING_RETRY_INSTRUCTION}`),
      lastAttempt: () => generateImage(coloringPrompt),
      imageBytes,
    });
    if (!finalBytes) {
      // Nothing saved, nothing charged; the parent sees a "try again" message.
      return jsonResponse({ coloringFailed: true, retryable: true, error: COLORING_FAILED_MESSAGE });
    }
    const chunks: string[] = [];
    for (let i = 0; i < finalBytes.length; i += 8192) {
      chunks.push(String.fromCharCode(...finalBytes.subarray(i, i + 8192)));
    }
    generatedImage = `data:image/png;base64,${btoa(chunks.join(""))}`;

    // ── Upload to storage & cache ──
    if (story_id && userId) {
      try {
        const base64Match = generatedImage.match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          const raw = base64Match[1];
          const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
          // One file per illustration (a per-story name made each new page overwrite the previous one).
          const pageKey = (illustration_url.split("?")[0].split("/").pop() || "page").replace(/\.[a-z]+$/i, "").replace(/[^a-zA-Z0-9_-]/g, "");
          const storagePath = `coloring/${story_id}-${pageKey}-${Date.now()}.png`;

          const { error: uploadErr } = await supabase.storage
            .from("story-illustrations")
            .upload(storagePath, bytes, { contentType: "image/png", upsert: true });

          if (uploadErr) {
            console.error("Failed to upload coloring page to storage:", uploadErr);
          } else {
            await supabase.from("story_coloring_pages").insert({
              story_id,
              user_id: ownerId,
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
