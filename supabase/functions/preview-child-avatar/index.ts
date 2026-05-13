import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GUEST_RATE_LIMIT = { maxRequests: 2, windowMs: 60 * 60 * 1000 };
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const AVATAR_GENERATION_STRATEGIES = [
  {
    model: "google/gemini-2.5-flash-image",
    prompt:
      "Create a high-fidelity Pixar 3D animation portrait of the child in this photo. CRITICAL — FACE ACCURACY: The result MUST be an exact likeness of this specific child. Preserve the EXACT face shape, eye shape and color, nose shape, mouth shape, eyebrow shape and arch. Keep the EXACT hair color, hair texture, hair length, and hair style. Match the EXACT skin tone and undertone. STYLE: Disney-Pixar 3D animation aesthetic like Encanto, Coco, and Inside Out — realistic proportions, detailed hair and skin texture, warm cinematic lighting, natural skin with subtle pores and warmth, expressive realistic eyes with detailed irises. Full head and shoulders framing, centered composition, simple clean pastel background. DO NOT change eye color. DO NOT alter hair color. DO NOT smooth away moles, freckles, birthmarks, or any distinguishing facial features. DO NOT change the child's unique facial structure. The result must look like the SAME child, just rendered in Pixar 3D animation style. Return image only.",
  },
  {
    model: "google/gemini-3.1-flash-image-preview",
    prompt:
      "Create a Pixar 3D animated portrait of this child with MAXIMUM facial accuracy. Keep the EXACT face shape, eye shape and color, nose shape, mouth shape, and eyebrow shape. Match the EXACT hair color, texture, length, and style. Match the EXACT skin tone and undertone. Use Disney-Pixar 3D CGI animation style — realistic proportions, warm cinematic lighting, detailed hair and skin texture, rich colorful rendering as seen in Encanto, Coco, and Inside Out. Head and shoulders framing, clean simple pastel background. DO NOT change eye color. DO NOT alter hair color. DO NOT remove or smooth away moles, freckles, or birthmarks. DO NOT change facial structure. The child must remain perfectly recognizable. Return image only.",
  },
] as const;

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractPreviewUrl = (data: any): string | null => {
  const directImage = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (directImage) return directImage;

  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part?.image_url?.url) return part.image_url.url;
      if (part?.inline_data?.data) {
        return `data:${part.inline_data.mime_type || "image/png"};base64,${part.inline_data.data}`;
      }
    }
  }

  const messageImage = data?.choices?.[0]?.message?.image?.url;
  if (messageImage) return messageImage;

  return null;
};

const callImageModel = async (
  apiKey: string,
  childPhoto: string,
  model: string,
  prompt: string,
) => {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: childPhoto,
              },
            },
          ],
        },
      ],
    }),
  });

  const rawText = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      rawText,
      data: null,
    };
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (error) {
    console.error("Failed to parse AI response JSON:", error);
    return {
      ok: false,
      status: 502,
      rawText,
      data: null,
    };
  }

  return {
    ok: true,
    status: response.status,
    rawText,
    data,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
          console.log("Authenticated user:", `${userId.substring(0, 8)}...`);
        } else {
          console.log("Auth token invalid, proceeding as guest");
        }
      } else {
        console.error("Missing Supabase auth env vars, proceeding as guest", {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasServiceRoleKey: Boolean(supabaseServiceKey),
        });
      }
    } else {
      console.log("No auth header, proceeding as guest");
    }

    if (userId) {
      const rateLimit = checkRateLimit(userId, "preview-avatar", RATE_LIMITS.aiFunction);
      if (!rateLimit.allowed) {
        console.log(`Rate limit exceeded for user: ${userId}`);
        return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
      }
    } else {
      const clientIP = getClientIP(req);
      const rateLimit = checkRateLimit(clientIP, "preview-avatar-guest", GUEST_RATE_LIMIT);
      if (!rateLimit.allowed) {
        console.log(`Guest rate limit exceeded for IP: ${clientIP}`);
        return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
      }
    }

    let body: { childPhoto?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "בקשה לא תקינה" }, 400);
    }

    const childPhoto = body.childPhoto;

    if (typeof childPhoto !== "string" || !childPhoto.trim()) {
      return jsonResponse({ error: "לא התקבלה תמונה" }, 400);
    }

    if (childPhoto.length > MAX_PHOTO_SIZE) {
      return jsonResponse({ error: "התמונה גדולה מדי (מקסימום 10MB)" }, 413);
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("Missing LOVABLE_API_KEY", { hasLovableApiKey: false });
      return jsonResponse({ error: "שגיאת הגדרה בשרת" }, 500);
    }

    console.log("Generating 3D preview for child photo...");

    for (const [index, strategy] of AVATAR_GENERATION_STRATEGIES.entries()) {
      console.log(`Avatar generation attempt ${index + 1} with model ${strategy.model}`);
      const result = await callImageModel(lovableApiKey, childPhoto, strategy.model, strategy.prompt);

      if (!result.ok) {
        console.error("AI Gateway error:", result.status, result.rawText.slice(0, 1000));

        if (result.status === 429) {
          return jsonResponse({ error: "יותר מדי בקשות. נסו שוב בעוד כמה דקות." }, 429);
        }
        if (result.status === 402) {
          return jsonResponse({ error: "השירות אינו זמין זמנית." }, 402);
        }
        continue;
      }

      console.log("AI response received, keys:", JSON.stringify(Object.keys(result.data ?? {})));
      const previewUrl = extractPreviewUrl(result.data);

      if (previewUrl) {
        console.log("Preview generated successfully");
        return jsonResponse({ previewUrl });
      }

      const message = result.data?.choices?.[0]?.message;
      console.error(
        "No image in response. Message preview:",
        JSON.stringify({
          content: message?.content,
          refusal: message?.refusal,
          finish_reason: result.data?.choices?.[0]?.finish_reason,
        }).slice(0, 1500),
      );
    }

    return jsonResponse({
      error: "לא הצלחנו ליצור אווטאר מהתמונה הזו. נסו תמונה אחרת או נסו שוב בעוד רגע.",
    }, 422);
  } catch (error) {
    console.error("Error generating preview:", error);
    return jsonResponse({ error: "שגיאה בעיבוד הבקשה" }, 500);
  }
});
