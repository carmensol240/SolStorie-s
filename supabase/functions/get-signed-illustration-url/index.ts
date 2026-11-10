import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATH_RE = /^([a-f0-9-]{36})\/[^\/]+\.(png|jpg|jpeg|webp)$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Every requested path is checked against ITS OWN story (the folder name).
// Access: the story's owner, an admin, or a public shared book the owner created for that story
// (share token, or the book marked public). Anything else is skipped.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { paths, shareToken } = body ?? {};

    if (!Array.isArray(paths) || paths.length === 0) return json({ error: "paths array is required" }, 400);
    if (paths.length > 20) return json({ error: "Maximum 20 paths per request" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Optional signed-in user
    let userId: string | null = null;
    let isAdmin = false;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user } } = await admin.auth.getUser(authHeader.slice(7));
      if (user) {
        userId = user.id;
        const { data: role } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
        isAdmin = role === true;
      }
    }

    // Story IDs taken from the paths themselves
    const valid: { path: string; storyId: string }[] = [];
    for (const p of paths) {
      if (typeof p !== "string" || p.includes("..")) continue;
      const m = p.match(PATH_RE);
      if (m) valid.push({ path: p, storyId: m[1].toLowerCase() });
    }
    const storyIds = [...new Set(valid.map((v) => v.storyId))];

    const allowed = new Set<string>();
    if (storyIds.length) {
      if (isAdmin) {
        storyIds.forEach((id) => allowed.add(id));
      } else {
        if (userId) {
          const { data: owned } = await admin.from("stories").select("id").in("id", storyIds).eq("user_id", userId);
          (owned ?? []).forEach((s: { id: string }) => allowed.add(s.id));
        }
        const rest = storyIds.filter((id) => !allowed.has(id));
        if (rest.length) {
          // Public shared books (owner turned sharing on)
          const { data: books } = await admin.from("digital_books").select("story_id, share_token, is_public").in("story_id", rest);
          for (const b of books ?? []) {
            if (b.is_public === true || (typeof shareToken === "string" && shareToken.length >= 32 && b.share_token === shareToken && b.is_public)) {
              allowed.add(b.story_id);
            }
          }
        }
      }
    }

    const signedUrls: Record<string, string> = {};
    let refused = 0;
    for (const { path, storyId } of valid) {
      if (!allowed.has(storyId)) { refused++; continue; }
      const { data, error } = await admin.storage.from("story-illustrations").createSignedUrl(path, 3600);
      if (error) { console.error(`Signed URL failed for ${path}:`, error.message); continue; }
      if (data?.signedUrl) signedUrls[path] = data.signedUrl;
    }

    if (valid.length > 0 && Object.keys(signedUrls).length === 0 && refused > 0) {
      return json({ error: "Unauthorized access to illustrations" }, 401);
    }
    return json({ signedUrls });
  } catch (error) {
    console.error("Error in get-signed-illustration-url:", error);
    return json({ error: "שגיאה בטעינת התמונות" }, 500);
  }
});
