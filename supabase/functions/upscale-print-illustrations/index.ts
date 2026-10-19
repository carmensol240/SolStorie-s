// Creates print-quality (>= 2551 px long side) copies of a story's illustrations
// with the FAL ESRGAN upscaler, stores them once and returns them on later calls.
// Only for the story owner who is entitled to the print file (same rule as the browser).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { hasPdfEntitlement } from "../_shared/pdf-entitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const TARGET = 2551;
const BUCKET = "story-illustrations";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function imageSize(b: Uint8Array): { w: number; h: number } | null {
  if (b[0] === 0x89 && b[1] === 0x50) {
    const v = new DataView(b.buffer, b.byteOffset);
    return { w: v.getUint32(16), h: v.getUint32(20) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      const len = (b[i + 2] << 8) | b[i + 3];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
      }
      i += 2 + len;
    }
  }
  if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    const f = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (f === "VP8X") return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (f === "VP8 ") return { w: (b[26] | (b[27] << 8)) & 0x3fff, h: (b[28] | (b[29] << 8)) & 0x3fff };
    if (f === "VP8L") {
      const n = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { storyId } = await req.json().catch(() => ({}));
    if (typeof storyId !== "string" || !/^[0-9a-f-]{36}$/i.test(storyId)) return json({ error: "storyId required" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: story } = await admin.from("stories").select("user_id").eq("id", storyId).maybeSingle();
    if (!story) return json({ error: "Not found" }, 404);
    const { data: isAdmin } = await admin.rpc("is_effective_admin", { _user_id: user.id });
    if (story.user_id !== user.id && !isAdmin) return json({ error: "Forbidden" }, 403);
    if (!(await hasPdfEntitlement(admin, user.id, storyId))) return json({ error: "PDF entitlement required" }, 403);

    const { data: pages } = await admin
      .from("story_pages")
      .select("id, page_number, illustration_url, print_illustration_url, print_illustration_width")
      .eq("story_id", storyId)
      .order("page_number");

    const FAL_KEY = Deno.env.get("FAL_KEY");
    const result: Record<string, { url: string; width: number | null; upscaled: boolean }> = {};
    const todo = (pages ?? []).filter((p) => p.illustration_url);
    let i = 0;

    const work = async () => {
      while (i < todo.length) {
        const p = todo[i++];
        const src = p.illustration_url as string;
        if (p.print_illustration_url) {
          result[src] = { url: p.print_illustration_url, width: p.print_illustration_width, upscaled: true };
          continue;
        }
        try {
          const srcUrl = src.startsWith("http") ? src : admin.storage.from(BUCKET).getPublicUrl(src).data.publicUrl;
          const orig = new Uint8Array(await (await fetch(srcUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer());
          const size = imageSize(orig);
          const long = size ? Math.max(size.w, size.h) : 1024;
          let outBytes: Uint8Array, outType = "image/jpeg", width = size?.w ?? null;
          if (long >= TARGET) {
            outBytes = orig;
          } else {
            if (!FAL_KEY) throw new Error("FAL_KEY missing");
            const scale = Math.min(4, Math.max(2, Math.ceil((TARGET / long) * 10) / 10));
            const r = await fetch("https://fal.run/fal-ai/esrgan", {
              method: "POST",
              signal: AbortSignal.timeout(60_000),
              headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: srcUrl, scale, model: "RealESRGAN_x4plus", output_format: "jpeg" }),
            });
            if (!r.ok) throw new Error(`esrgan ${r.status} ${(await r.text()).slice(0, 200)}`);
            const d = await r.json();
            const img = await fetch(d.image.url);
            outType = img.headers.get("content-type") || d.image.content_type || "image/png";
            outBytes = new Uint8Array(await img.arrayBuffer());
            width = d.image.width ?? imageSize(outBytes)?.w ?? null;
          }
          const ext = outType.includes("png") ? "png" : outType.includes("webp") ? "webp" : "jpg";
          const path = `${storyId}/print/page-${p.page_number}.${ext}`;
          const up = await admin.storage.from(BUCKET).upload(path, outBytes, { contentType: outType, upsert: true });
          if (up.error) throw up.error;
          const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
          await admin.from("story_pages").update({ print_illustration_url: publicUrl, print_illustration_width: width }).eq("id", p.id);
          result[src] = { url: publicUrl, width, upscaled: long < TARGET };
          console.log(`print page ${p.page_number}: ${long}px -> ${width}px`);
        } catch (e) {
          console.error(`upscale failed for page ${p.page_number}:`, e);
        }
      }
    };
    await Promise.all([work(), work(), work()]);
    return json({ images: result });
  } catch (e) {
    console.error("upscale-print-illustrations error", e);
    return json({ error: "Internal error" }, 500);
  }
});
