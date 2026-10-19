import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { cleanColoringImage } from "../_shared/coloring-image.ts";
import { COLOR_FRACTION_LIMIT } from "../_shared/coloring-pixels.ts";

const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

// Maintenance only: no AI, no story/credit writes. Removed from deployment after repair.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply({ error: "Configuration unavailable" }, 500);
    const client = createClient(url, key);
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return reply({ error: "Unauthorized" }, 401);
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return reply({ error: "Unauthorized" }, 401);
    const { data: isAdmin, error: roleError } = await client.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError || !isAdmin) return reply({ error: "Forbidden" }, 403);
    const body = await req.json();
    const offset = body.offset ?? 0;
    const limit = body.limit ?? 3;
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 5 || typeof body.repair !== "boolean") {
      return reply({ error: "Invalid batch" }, 400);
    }
    const bucket = client.storage.from("story-illustrations");
    const { data: files, error: listError } = await bucket.list("coloring", { offset, limit, sortBy: { column: "name", order: "asc" } });
    if (listError) throw listError;
    const results = [];
    for (const file of files ?? []) {
      if (!file.id) return reply({ error: "Nested coloring folder requires review", name: file.name }, 409);
      const path = `coloring/${file.name}`;
      try {
        const { data, error } = await bucket.download(path);
        if (error || !data) throw error ?? new Error("Missing file");
        const cleaned = await cleanColoringImage(new Uint8Array(await data.arrayBuffer()));
        let repaired = false;
        if (body.repair && cleaned.coloredFraction > COLOR_FRACTION_LIMIT) {
          const { error: uploadError } = await bucket.upload(path, cleaned.bytes, { upsert: true, contentType: "image/png", cacheControl: "0" });
          if (uploadError) throw uploadError;
          repaired = true;
        }
        results.push({ path, coloredFraction: cleaned.coloredFraction, repaired });
      } catch (error) {
        results.push({ path, error: error instanceof Error ? error.message : "Storage processing failed" });
      }
    }
    return reply({ results, nextOffset: offset + (files?.length ?? 0), done: (files?.length ?? 0) < limit });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Repair failed" }, 500);
  }
});