// Opens the signed-in user's own free-taste story with one story credit
// (the "open this story with one credit" button in the library / lock screen).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { unlockTasteAndComplete } from "../_shared/taste-server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "נדרשת התחברות" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error } = await sb.auth.getUser(auth.slice(7));
    if (error || !user) return json({ error: "נדרשת התחברות" }, 401);

    const body = await req.json().catch(() => ({}));
    const storyId = typeof body?.storyId === "string" ? body.storyId : "";
    if (!/^[0-9a-f-]{36}$/i.test(storyId)) return json({ error: "מזהה סיפור לא תקין" }, 400);

    const ck = body?.creditKind === "full" || body?.creditKind === "digital" ? body.creditKind : null;
    const result = await unlockTasteAndComplete(sb, user.id, storyId, ck);
    if (result.kind === "unlocked") return json({ success: true });
    if (result.kind === "no_credits") return json({ error: "אין קרדיטים", code: "NO_CREDITS" }, 402);
    if (result.kind === "not_taste") return json({ success: true, alreadyOpen: true });
    if (result.kind === "not_owner" || result.kind === "not_found") return json({ error: "הסיפור לא נמצא" }, 404);
    return json({ error: "שגיאה בפתיחת הסיפור" }, 500);
  } catch (e) {
    console.error("[unlock-taste-story]", e);
    return json({ error: "שגיאה בפתיחת הסיפור" }, 500);
  }
});
