import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const storyIdParam = url.searchParams.get("storyId");

    if (!storyIdParam) {
      return new Response("Missing storyId", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find story by UUID first, then by slug
    let story: any = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(storyIdParam)) {
      const { data } = await supabase
        .from("stories")
        .select("id, slug, topic, child_name, cover_url, language")
        .eq("id", storyIdParam)
        .maybeSingle();
      story = data;
    }

    if (!story) {
      const { data } = await supabase
        .from("stories")
        .select("id, slug, topic, child_name, cover_url, language")
        .eq("slug", storyIdParam)
        .maybeSingle();
      story = data;
    }

    if (!story) {
      return Response.redirect("https://soulstory.co.il", 302);
    }

    const slug = story.slug || story.id;
    const title = `✨ ${story.topic} ✨ – סיפור של ${story.child_name}`;
    const description = `סיפור קסום שנוצר במיוחד עבור ${story.child_name} באפליקציית SolStorie's™ 📚`;
    const imageUrl = story.cover_url || "https://soulstory.co.il/favicon.png";
    const pageUrl = `https://soulstory.co.il/s/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="he_IL" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <p>מעביר אותך לסיפור...</p>
  <script>window.location.href = "${pageUrl}";</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("og-story-meta error:", err);
    return Response.redirect("https://soulstory.co.il", 302);
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
