import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { illustration_url, story_title, child_name } = await req.json();

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
              text: "Convert this illustration to a children's coloring book page. Black outlines only on white background. Keep lines thick, bold and friendly for a 4-year-old to color. Simplify details. Remove all colors and fills. Output only the coloring page image.",
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
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-3-pro-image-preview",
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

        if (aiResponse.status !== 429 || attempt === maxRetries) break;

        const retryAfterHeader = aiResponse.headers.get("retry-after");
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
        const backoffSeconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds
          : Math.min(30, 5 * (2 ** attempt));
        const jitterMs = Math.floor(Math.random() * 1000);

        console.log(`Rate limited on ${model} (attempt ${attempt + 1}/${maxRetries + 1}), waiting ${backoffSeconds}s...`);
        await new Promise((r) => setTimeout(r, backoffSeconds * 1000 + jitterMs));
      }

      if (aiResponse?.ok) break;
      if (aiResponse?.status === 402) break;
      if (aiResponse?.status === 429) {
        console.log(`Model ${model} still rate limited, trying next model...`);
        continue;
      }
      break;
    }

    if (!aiResponse!.ok) {
      const status = aiResponse!.status;
      if (status === 429) {
        return new Response(JSON.stringify({
          error: "השרת עמוס כרגע. נסו שוב בעוד כדקה",
          code: "RATE_LIMITED",
          retryable: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({
          error: "נגמרו הקרדיטים, נסו שוב מאוחר יותר",
          code: "CREDITS_EXHAUSTED",
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
