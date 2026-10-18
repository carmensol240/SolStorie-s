// Parent-controlled deletion: one child's photo, one child profile (keep or delete stories), or the whole account.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { emailTasteHash } from "../_shared/taste.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const UUID = /^[0-9a-f-]{36}$/i;

// deno-lint-ignore no-explicit-any
type SB = any;

const isPath = (p: unknown): p is string => typeof p === "string" && !!p && !p.startsWith("data:") && !p.startsWith("blob:") && !p.startsWith("http");

async function listAll(sb: SB, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error || !data?.length) break;
    for (const f of data) {
      if (f.id === null) out.push(...await listAll(sb, bucket, `${prefix}/${f.name}`));
      else out.push(`${prefix}/${f.name}`);
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function removeFiles(sb: SB, bucket: string, paths: string[]) {
  const uniq = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < uniq.length; i += 100) {
    const { error } = await sb.storage.from(bucket).remove(uniq.slice(i, i + 100));
    if (error) throw new Error(`storage remove failed: ${error.message}`);
  }
}

async function deleteStoriesFully(sb: SB, storyIds: string[]) {
  if (!storyIds.length) return;
  const files: string[] = [];
  const childPhotoFiles: string[] = [];
  for (const id of storyIds) {
    files.push(...await listAll(sb, "story-illustrations", id), `coloring/${id}.png`);
  }
  const { data: col } = await sb.from("story_coloring_pages").select("coloring_image_path").in("story_id", storyIds);
  for (const r of col ?? []) if (isPath(r.coloring_image_path)) files.push(r.coloring_image_path);
  const { data: st } = await sb.from("stories").select("child_photo_path").in("id", storyIds);
  for (const r of st ?? []) if (isPath(r.child_photo_path)) childPhotoFiles.push(r.child_photo_path);
  await removeFiles(sb, "story-illustrations", files);
  await removeFiles(sb, "child-photos", childPhotoFiles);
  const { error } = await sb.rpc("delete_story_rows", { p_story_ids: storyIds });
  if (error) throw new Error(error.message);
}

/** Removes the child's photo, avatar and per-story photo copies; clears them from the profile. */
async function deleteChildPhoto(sb: SB, userId: string, child: { id: string; photo_url: string | null; avatar_url: string | null }) {
  const files: string[] = [];
  if (isPath(child.photo_url)) files.push(child.photo_url);
  if (isPath(child.avatar_url)) files.push(child.avatar_url);
  const own = await listAll(sb, "child-photos", userId);
  files.push(...own.filter((p) => p.startsWith(`${userId}/${child.id}`)));
  const { data: st } = await sb.from("stories").select("id, child_photo_path").eq("user_id", userId).eq("child_id", child.id);
  for (const r of st ?? []) if (isPath(r.child_photo_path)) files.push(r.child_photo_path);
  await removeFiles(sb, "child-photos", files);
  await sb.from("stories").update({ child_photo_path: null }).eq("user_id", userId).eq("child_id", child.id);
  const { error } = await sb.from("children").update({ photo_url: null, avatar_url: null, avatar_description: null }).eq("id", child.id);
  if (error) throw new Error(error.message);
}

async function sendDeletionEmail(email: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6">
<p>שלום,</p><p>החשבון שלך ב-SolStories נמחק לבקשתך, יחד עם פרופילי הילדים, התמונות, הסיפורים, האיורים ודפי הצביעה.</p>
<p>רשומות רכישה נשמרות לצורכי הנהלת חשבונות בלבד, ללא שם או מייל.</p>
<p>אם לא ביקשת את המחיקה, כתבו לנו: solstories.nlp@gmail.com</p><p>צוות SolStories</p></div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: "SolStories <noreply@soulstory.co.il>", to: [email], subject: "החשבון שלך ב-SolStories נמחק", html }),
    });
  } catch (e) { console.error("[delete] email failed", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "נדרשת התחברות" }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: uErr } = await sb.auth.getUser(auth.slice(7));
    if (uErr || !user) return json({ error: "נדרשת התחברות" }, 401);
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "delete_child_photo" || action === "delete_child") {
      if (typeof body.child_id !== "string" || !UUID.test(body.child_id)) return json({ error: "child_id לא תקין" }, 400);
      const { data: child } = await sb.from("children").select("id, photo_url, avatar_url").eq("id", body.child_id).eq("user_id", user.id).maybeSingle();
      if (!child) return json({ error: "לא נמצא" }, 404);
      await deleteChildPhoto(sb, user.id, child);
      if (action === "delete_child") {
        if (body.delete_stories === true) {
          const { data: st } = await sb.from("stories").select("id").eq("user_id", user.id).eq("child_id", child.id);
          await deleteStoriesFully(sb, (st ?? []).map((r: { id: string }) => r.id));
        }
        const { error } = await sb.from("children").delete().eq("id", child.id);
        if (error) throw new Error(error.message);
      }
      return json({ ok: true });
    }

    if (action === "delete_account") {
      if (body.confirm !== "מחק") return json({ error: "יש להקליד מחק לאישור" }, 400);
      const uid = user.id;
      const { data: st } = await sb.from("stories").select("id").eq("user_id", uid);
      await deleteStoriesFully(sb, (st ?? []).map((r: { id: string }) => r.id));
      const photoFiles = [
        ...await listAll(sb, "child-photos", uid),
        ...await listAll(sb, "child-photos", `taste-refs/${uid}`),
        ...await listAll(sb, "child-photos", `temp-refs/${uid}`),
      ];
      await removeFiles(sb, "child-photos", photoFiles);
      await removeFiles(sb, "story-illustrations", await listAll(sb, "story-illustrations", `temp-refs/${uid}`));
      const { error: rErr } = await sb.rpc("delete_user_rows", { p_user: uid, p_email_hash: await emailTasteHash(user.email) });
      if (rErr) throw new Error(rErr.message);
      if (user.email) await sendDeletionEmail(user.email);
      const { error: dErr } = await sb.auth.admin.deleteUser(uid);
      if (dErr) throw new Error(dErr.message);
      return json({ ok: true });
    }
    return json({ error: "פעולה לא מוכרת" }, 400);
  } catch (e) {
    console.error("[delete-user-data]", e);
    return json({ error: "המחיקה נכשלה, נסו שוב" }, 500);
  }
});
