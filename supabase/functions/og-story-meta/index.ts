import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { translateTopic } from "../_shared/topic-hebrew.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const storyIdParam = (url.searchParams.get("s") || url.searchParams.get("storyId") || "").trim();

    const siteOrigin = "https://soulstory.co.il";
    const defaultOgImage = "https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/topic-images/sol-superhero-book-og.png";

    // Slug only (short share code); no lookup by other fields, no listing.
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(storyIdParam) || UUID_RE.test(storyIdParam)) {
      return Response.redirect(siteOrigin, 302);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: story } = await supabase
      .from("stories")
      .select("id, slug, topic, child_name, cover_url, language")
      .eq("slug", storyIdParam)
      .maybeSingle();

    if (!story) {
      return Response.redirect(siteOrigin, 302);
    }

    let rawCoverUrl: string | null = story.cover_url;
    if (!rawCoverUrl) {
      // Locked rule 2: first illustration of this story, never a stock image when one exists.
      const { data: firstPage } = await supabase
        .from("story_pages")
        .select("illustration_url")
        .eq("story_id", story.id)
        .not("illustration_url", "is", null)
        .order("page_number", { ascending: true })
        .limit(1)
        .maybeSingle();
      rawCoverUrl = firstPage?.illustration_url ?? null;
    }

    const topicLabel = translateTopic(story.topic || "", story.language);
    const title = `✨ הסיפור של ${story.child_name} – ${topicLabel} | SolStories`;
    const description = `סיפור קסום שנוצר במיוחד עבור ${story.child_name}. לחצו לקריאת הסיפור 📚`;
    const imageUrl = resolveImageUrl(rawCoverUrl, defaultOgImage, supabaseUrl);
    const shareUrl = `${siteOrigin}/s/${story.slug}`;
    const viewUrl = shareUrl;

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
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
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

function resolveImageUrl(rawUrl: string | null, defaultUrl: string, supabaseStorageBase: string): string {
  if (!rawUrl) return defaultUrl;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  // Relative storage path → build full public URL
  return `${supabaseStorageBase}/storage/v1/object/public/story-illustrations/${rawUrl}`;
}
