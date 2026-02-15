import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { storyId, pageId } = await req.json();
    if (!storyId || !pageId) {
      return new Response(JSON.stringify({ error: "Missing storyId or pageId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify story ownership
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, user_id, child_gender, age_range, child_name, topic")
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

    // Get child photo if available
    let childPhoto: string | null = null;
    const { data: child } = await supabase
      .from("children")
      .select("avatar_url, photo_url, avatar_description")
      .eq("user_id", user.id)
      .eq("name", story.child_name)
      .maybeSingle();

    if (child?.avatar_url) {
      const { data: signedData } = await supabase.storage
        .from("child-photos")
        .createSignedUrl(child.avatar_url, 600);
      if (signedData?.signedUrl) childPhoto = signedData.signedUrl;
    } else if (child?.photo_url) {
      const { data: signedData } = await supabase.storage
        .from("child-photos")
        .createSignedUrl(child.photo_url, 600);
      if (signedData?.signedUrl) childPhoto = signedData.signedUrl;
    }

    // Build character profile
    let characterProfile = null;
    if (child?.avatar_description) {
      try { characterProfile = JSON.parse(child.avatar_description); } catch {}
    }

    const stylePrefix = `In the style of modern 3D Disney-Pixar animation, high resolution, magical atmosphere, magical glowing light, dreamy warm and inviting atmosphere. Characters with large expressive emotional eyes, detailed hair, soft textures. ALWAYS show characters as FULL BODY (head to toe) or at minimum from waist up — NEVER just a head or face. 9:16 portrait aspect ratio. NEGATIVE PROMPT / EXCLUDE: floating head, disembodied head, head without body, missing body, missing limbs, extra limbs, deformed, distorted, scary, horror, grotesque, mutated, disfigured, severed, decapitated, cropped head only, face only, no body, text, watermark, UI elements, buttons, audio icons.`;
    const prompt = page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;

    const requestBody: any = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [{
        role: "user",
        content: childPhoto
          ? [
              { type: "text", text: `Based on this child's photo, create a HIGH QUALITY 3D Disney-Pixar style illustration: ${stylePrefix} SCENE: ${prompt}` },
              { type: "image_url", image_url: { url: childPhoto } }
            ]
          : `${stylePrefix} ${prompt}`
      }]
    };

    console.log(`Retrying illustration for story ${storyId}, page ${page.page_number}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${storyId}/page-${page.page_number}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update page
    await supabase
      .from("story_pages")
      .update({ illustration_url: filePath })
      .eq("id", pageId);

    // Cover is now handled by the dedicated generate-cover function
    // Retrying page 1 no longer updates cover_url

    console.log(`✅ Retry illustration success for page ${page.page_number}`);

    return new Response(
      JSON.stringify({ success: true, illustrationUrl: filePath }),
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
