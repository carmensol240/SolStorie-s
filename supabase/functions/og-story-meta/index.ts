import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common bot/crawler user agents
const CRAWLER_PATTERNS = [
  'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot',
  'telegrambot', 'linkedinbot', 'slackbot', 'discordbot',
  'googlebot', 'bingbot', 'yandexbot', 'baiduspider',
  'pinterest', 'skypeuripreview', 'vkshare', 'embedly',
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
}

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

    const siteOrigin = "https://soulstory.co.il";

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
      return Response.redirect(siteOrigin, 302);
    }

    const slug = story.slug || story.id;
    const title = `הסיפור של ${story.child_name} ב-SolStorie's™`;
    const description = `בואו לקרוא סיפור קסום ומעצים שיצרנו בעולמה הקסום של סול!`;
    const imageUrl = story.cover_url || `${siteOrigin}/favicon.png`;
    const shareUrl = `${siteOrigin}/story/${slug}`;
    const viewUrl = `${siteOrigin}/story/${slug}`;

    const userAgent = req.headers.get("user-agent") || "";
    const isBot = isCrawler(userAgent);

    // No http-equiv refresh – use JS redirect only for humans
    const redirectScript = isBot
      ? ""
      : `<script>window.location.replace("${viewUrl}");</script>`;

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(shareUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="he_IL" />
  <meta property="og:site_name" content="SolStorie's™" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>
<body>
  <p>מעביר אותך לסיפור...</p>
  ${redirectScript}
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
