import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const { illustration_url, story_title, child_name, story_id, device_id } = await req.json();

    if (!illustration_url) {
      return new Response(JSON.stringify({ error: "illustration_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the illustration image
    console.log("Downloading illustration:", illustration_url);
    const imgResponse = await fetch(illustration_url);
    if (!imgResponse.ok) {
      console.error("Failed to download illustration:", imgResponse.status);
      return new Response(JSON.stringify({ error: "Failed to download illustration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imgBuffer = await imgResponse.arrayBuffer();
    const imgBase64 = btoa(
      new Uint8Array(imgBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const mimeType = imgResponse.headers.get("content-type") || "image/png";
    const imageDataUrl = `data:${mimeType};base64,${imgBase64}`;

    console.log("Sending to Gemini for coloring page conversion...");

    // Call Lovable AI Gateway with adaptive retries + model fallback to reduce 429 failures
    const buildAiBody = (model: string) => JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Convert this illustration into a perfect children's coloring book page for printing. Follow these rules strictly:

1. OUTLINES: Use very thick, bold, solid black outlines (minimum 3-4px weight). Every shape must have a clearly defined closed boundary.
2. SIMPLICITY: Create large, simple areas for coloring. Merge small details into bigger shapes. A 3-year-old should be able to color inside the lines.
3. STYLE: Disney/Pixar cartoon style with rounded, friendly shapes. Keep the character recognizable but simplified.
4. NO SHADING: Absolutely no shadows, gradients, cross-hatching, stippling, or any form of shading. Pure black outlines on pure white background only.
5. NO 3D DEPTH: Flatten all 3D elements into simple 2D cartoon outlines.
6. MINIMAL DETAILS: Remove textures, patterns, small decorative elements. Keep only the essential shapes of the character and main objects.
7. RESOLUTION: Output a high-resolution image (at least 2400x3200 pixels) suitable for 300 DPI A4 printing.
8. BACKGROUND: Pure white (#FFFFFF) background with no marks or artifacts.

Output ONLY the coloring page image, nothing else. Do not include any text, labels, letter names, or written words anywhere in the image.`,
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      modalities: ["image", "text"],
    });

    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const modelFallbacks = [
      "google/gemini-3-pro-image-preview",
      "google/gemini-3.1-flash-image-preview",
    ];

    let aiResponse: Response | null = null;
    for (const model of modelFallbacks) {
      const aiBody = buildAiBody(model);
      const maxRetries = 4;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: aiHeaders,
          body: aiBody,
        });

        if (aiResponse.ok) break;

        const retryableStatus = aiResponse.status === 429 || aiResponse.status === 502 || aiResponse.status === 503;
        if (!retryableStatus || attempt === maxRetries) break;

        const retryAfterHeader = aiResponse.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
        const backoffSeconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds
          : Math.min(30, 5 * (2 ** attempt));
        const jitterMs = Math.floor(Math.random() * 1000);

        console.log(`Retryable error ${aiResponse.status} on ${model} (attempt ${attempt + 1}/${maxRetries + 1}), waiting ${backoffSeconds}s...`);
        await new Promise((r) => setTimeout(r, backoffSeconds * 1000 + jitterMs));
      }

      if (aiResponse?.ok) break;
      if (aiResponse?.status === 402) {
        console.log(`Model ${model} failed with 402, trying next model...`);
        continue;
      }
      if (aiResponse?.status === 429 || aiResponse?.status === 502 || aiResponse?.status === 503) {
        console.log(`Model ${model} failed with ${aiResponse?.status}, trying next model...`);
        continue;
      }
      break;
    }

    if (!aiResponse!.ok) {
      const status = aiResponse!.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({
          error: "השירות עמוס כרגע, נסו שוב בעוד כמה דקות 🎨",
          retryable: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse!.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "שגיאה ביצירת דף הצביעה" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse!.json();

    // Try multiple extraction paths for image data
    let generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      const content = aiData.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imgPart = content.find((p: any) => p.type === "image_url" || p.type === "image");
        generatedImage = imgPart?.image_url?.url || imgPart?.url;
      }
      if (!generatedImage && typeof content === "string" && content.startsWith("data:image")) {
        generatedImage = content;
      }
    }

    if (!generatedImage) {
      console.error("No image returned from AI. Response structure:", JSON.stringify(aiData).slice(0, 1000));
      return new Response(JSON.stringify({ error: "לא התקבלה תמונה מהמערכת" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Coloring page generated successfully");

    return new Response(
      JSON.stringify({ image: generatedImage, story_title, child_name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-coloring-page error:", err);
    return new Response(JSON.stringify({ error: "שגיאה פנימית" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
