import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { isLegacyOpenStory } from "../_shared/legacy-access.ts";
import { COLORING_FAILED_MESSAGE, COLORING_RETRY_INSTRUCTION, produceCleanColoringPage } from "../_shared/coloring-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STALE_PENDING_MS = 3 * 60 * 1000;
const UUID = /^[0-9a-f-]{36}$/i;

const PROMPT = `Convert this character portrait into a perfect children's coloring book page for printing. Follow these rules strictly:

1. OUTLINES: Clean, even black outlines of medium weight (about 2-3px). Every shape must have a clearly defined closed boundary. NEVER fill any area with black: hair, shadows, clothing, eyes' surroundings and dark objects are drawn as outlines with white inside.
2. CLOSED REGIONS: Every area MUST be completely enclosed by continuous unbroken black lines, no gaps.
3. SIMPLICITY: Large, simple areas for coloring. A 3-year-old should be able to color inside the lines.
4. STYLE: Disney/Pixar cartoon style with rounded, friendly shapes. Keep the child recognizable (face, hair style, clothing) but simplified.
5. NO SHADING: No shadows, gradients, cross-hatching or stippling. Pure black outlines on pure white only.
6. NO 3D DEPTH: Flatten into simple 2D cartoon outlines.
7. MINIMAL DETAILS: Remove textures and small decorations.
8. RESOLUTION: High resolution (at least 2400x3200 pixels) for 300 DPI A4 printing.
9. COMPOSITION: ONE single character only, full body, large and centered, filling most of a portrait A4 page, simple pure white background (at most a few simple ground lines or stars), no other people.
10. No text, letters, names or words anywhere in the image.

Output ONLY the coloring page image.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let pendingChildId: string | null = null;
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user?.id) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const childId = String(body?.child_id || "");
    const regenerate = body?.regenerate === true;
    if (!UUID.test(childId)) return json({ error: "child_id is required" }, 400);

    const { data: child } = await supabase.from("children").select("id, user_id, name, avatar_url").eq("id", childId).maybeSingle();
    if (!child) return json({ error: "Child not found" }, 404);
    const { data: isAdmin } = await supabase.rpc("is_effective_admin", { _user_id: user.id });
    if (child.user_id !== user.id && !isAdmin) return json({ error: "Forbidden" }, 403);
    if (!child.avatar_url) return json({ error: "No avatar" }, 400);
    const ownerId: string = child.user_id;

    // Purchase check: at least one unlocked story, or an old credit story that counts as open.
    if (!isAdmin) {
      const { data: unlocks } = await supabase.from("story_unlocks").select("id").eq("user_id", ownerId).limit(1);
      let bought = (unlocks?.length ?? 0) > 0;
      if (!bought) {
        const { data: old } = await supabase.from("stories").select("user_id, is_taste, created_at")
          .eq("user_id", ownerId).eq("is_taste", false).order("created_at", { ascending: true }).limit(1);
        bought = isLegacyOpenStory(old?.[0], ownerId);
      }
      if (!bought) return json({ error: "Not purchased" }, 403);
    }

    // One page per child; a pending row locks against double clicks.
    const { data: existing } = await supabase.from("child_portrait_coloring").select("*").eq("child_id", childId).maybeSingle();
    if (existing?.status === "ready" && !(regenerate && isAdmin)) {
      return json({ path: existing.coloring_image_path, cached: true });
    }
    if (existing?.status === "pending" && Date.now() - new Date(existing.updated_at).getTime() < STALE_PENDING_MS) {
      return json({ inProgress: true }, 409);
    }
    if (existing) {
      const { data: claimed } = await supabase.from("child_portrait_coloring")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", existing.id).eq("updated_at", existing.updated_at).select("id");
      if (!claimed?.length) return json({ inProgress: true }, 409);
    } else {
      const { error: insErr } = await supabase.from("child_portrait_coloring").insert({ child_id: childId, user_id: ownerId, status: "pending" });
      if (insErr) return json({ inProgress: true }, 409); // unique child_id: another click got there first
    }
    pendingChildId = existing?.status === "ready" ? null : childId;
    const previous = existing?.status === "ready" ? existing : null;

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    let imageUrl: string = child.avatar_url;
    if (!imageUrl.startsWith("data:")) {
      const r = await fetch(imageUrl);
      if (!r.ok) throw new Error("avatar download failed");
      const b = new Uint8Array(await r.arrayBuffer());
      let s = ""; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192));
      imageUrl = `data:${r.headers.get("content-type") || "image/png"};base64,${btoa(s)}`;
    }

    const models = ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image"];
    const generate = async (prompt: string): Promise<string | undefined> => {
      for (const model of models) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl } }] }],
            modalities: ["image", "text"],
            image_config: { aspect_ratio: "2:3" },
          }),
        });
        if (!res.ok) { console.warn("portrait coloring model failed", model, res.status); continue; }
        const data = await res.json();
        const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (url) return url;
      }
      return undefined;
    };
    const imageBytes = async (url: string) => {
      const m = url.match(/^data:image\/[^;]+;base64,(.+)$/s);
      if (m) return Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0));
      const r = await fetch(url);
      return new Uint8Array(await r.arrayBuffer());
    };

    const first = await generate(PROMPT);
    const bytes = first ? await produceCleanColoringPage({
      first,
      regenerate: () => generate(`${PROMPT}\n\n${COLORING_RETRY_INSTRUCTION}`),
      lastAttempt: () => generate(PROMPT),
      imageBytes,
    }) : null;

    if (!bytes) {
      if (previous) await supabase.from("child_portrait_coloring").update({ status: "ready" }).eq("child_id", childId);
      else await supabase.from("child_portrait_coloring").delete().eq("child_id", childId);
      pendingChildId = null;
      return json({ coloringFailed: true, error: COLORING_FAILED_MESSAGE });
    }

    const path = `coloring/portrait-${childId}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage.from("story-illustrations").upload(path, bytes, { contentType: "image/png" });
    if (upErr) throw upErr;
    await supabase.from("child_portrait_coloring")
      .update({ status: "ready", coloring_image_path: path, updated_at: new Date().toISOString() })
      .eq("child_id", childId);
    pendingChildId = null;
    return json({ path });
  } catch (e) {
    console.error("generate-child-portrait-coloring error", e);
    if (pendingChildId) {
      await supabase.from("child_portrait_coloring").delete().eq("child_id", pendingChildId).eq("status", "pending");
    }
    return json({ coloringFailed: true, error: COLORING_FAILED_MESSAGE });
  }
});
