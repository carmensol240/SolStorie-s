// Edge function that deletes temp-refs/* files older than 24 hours from the
// child-photos bucket. Intended to be invoked by a pg_cron schedule.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "child-photos";
const PREFIX = "temp-refs";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const PAGE_SIZE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const cutoff = Date.now() - MAX_AGE_MS;
  const toDelete: string[] = [];

  try {
    // List all per-user folders under temp-refs/
    const { data: userFolders, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(PREFIX, { limit: PAGE_SIZE });

    if (listErr) throw listErr;

    for (const folder of userFolders ?? []) {
      // Folders show up as entries without metadata. Skip stray files at the top.
      if (!folder.name) continue;
      const folderPath = `${PREFIX}/${folder.name}`;

      let offset = 0;
      while (true) {
        const { data: files, error: filesErr } = await supabase.storage
          .from(BUCKET)
          .list(folderPath, { limit: PAGE_SIZE, offset });

        if (filesErr) {
          console.error(`list ${folderPath} failed:`, filesErr);
          break;
        }
        if (!files || files.length === 0) break;

        for (const f of files) {
          if (!f.name) continue;
          // created_at is ISO timestamp; fall back to updated_at if missing.
          const tsStr = (f as { created_at?: string; updated_at?: string }).created_at
            ?? (f as { updated_at?: string }).updated_at;
          if (!tsStr) continue;
          const ts = Date.parse(tsStr);
          if (Number.isFinite(ts) && ts < cutoff) {
            toDelete.push(`${folderPath}/${f.name}`);
          }
        }

        if (files.length < PAGE_SIZE) break;
        offset += files.length;
      }
    }

    let removed = 0;
    // Storage API accepts batches; chunk to be safe.
    for (let i = 0; i < toDelete.length; i += 100) {
      const chunk = toDelete.slice(i, i + 100);
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove(chunk);
      if (rmErr) {
        console.error("remove chunk failed:", rmErr);
      } else {
        removed += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scanned_folders: userFolders?.length ?? 0, removed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("cleanup-temp-refs error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});