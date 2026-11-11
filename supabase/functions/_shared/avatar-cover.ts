// Book cover = the child's drawn avatar, exactly as it is (stories created from AVATAR_COVER_CUTOFF).
// Page 1 stays a drawn scene; only stories.cover_url points to a frozen public copy of the avatar.
// Only children.avatar_url (the drawn avatar) is ever published — never photo_url (the real photo).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export const AVATAR_COVER_CUTOFF = "2026-11-11T19:30:00Z";
export const AVATAR_COVER_FILE = "cover-avatar.png";
export const AVATAR_COVER_ALERT_TYPE = "avatar_cover_missing";

export function usesAvatarCover(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && t >= new Date(AVATAR_COVER_CUTOFF).getTime();
}

/** True when a cover URL is the avatar copy (so page 1 must never overwrite it). */
export function isAvatarCoverUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.split("?")[0].endsWith(`/${AVATAR_COVER_FILE}`);
}

export function avatarCoverPath(storyId: string): string {
  return `${storyId}/${AVATAR_COVER_FILE}`;
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Exact bytes of a drawn avatar, or a reason it may not be published.
 * Only a PNG data URL qualifies (the avatar maker returns PNG); JPEG/HTTP/storage paths are
 * treated as possibly a real uploaded photo and refused.
 */
export function avatarCoverBytes(avatar: unknown): { bytes: Uint8Array } | { reason: string } {
  if (typeof avatar !== "string" || !avatar) return { reason: "no_avatar" };
  const m = /^data:image\/png;base64,(.+)$/s.exec(avatar);
  if (!m) return { reason: "not_png_data_url" };
  let bin: string;
  try { bin = atob(m[1].replace(/\s+/g, "")); } catch { return { reason: "bad_base64" }; }
  if (bin.length < 1000) return { reason: "too_small" };
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (!PNG_SIG.every((b, i) => bytes[i] === b)) return { reason: "not_png_bytes" };
  return { bytes };
}

/**
 * Saves the avatar as the story's public cover and points stories.cover_url at it.
 * Never throws; on any failure the cover stays page 1 (old behaviour) and the admin is alerted.
 */
// deno-lint-ignore no-explicit-any
export async function saveAvatarCover(supabase: any, story: { id: string; user_id: string | null; child_id: string | null; child_name: string; created_at?: string | null }): Promise<string | null> {
  if (!usesAvatarCover(story.created_at ?? new Date().toISOString()) || !story.user_id) return null;
  let reason = "no_avatar";
  try {
    let q = supabase.from("children").select("avatar_url").eq("user_id", story.user_id);
    q = story.child_id ? q.eq("id", story.child_id) : q.eq("name", story.child_name);
    const { data } = await q.limit(1).maybeSingle();
    const res = avatarCoverBytes(data?.avatar_url);
    if ("bytes" in res) {
      const path = avatarCoverPath(story.id);
      const { error } = await supabase.storage.from("story-illustrations")
        .upload(path, res.bytes, { contentType: "image/png", upsert: true });
      if (!error) {
        const pub = supabase.storage.from("story-illustrations").getPublicUrl(path).data?.publicUrl;
        const url = `${pub}?v=${Date.now()}`;
        await supabase.from("stories").update({ cover_url: url }).eq("id", story.id);
        console.log(`[avatar-cover] ✅ story=${story.id}`);
        return url;
      }
      reason = `upload_failed: ${error.message}`;
    } else reason = res.reason;
  } catch (e) {
    reason = `error: ${(e as Error)?.message || e}`;
  }
  console.warn(`[avatar-cover] fallback to page 1 story=${story.id} reason=${reason}`);
  try {
    const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && key) {
      const sb = createClient(url, key);
      const { data: admin } = await sb.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      const alertUser = (admin as any)?.user_id || story.user_id;
      await sb.from("admin_alerts").insert({
        user_id: alertUser, alert_type: AVATAR_COVER_ALERT_TYPE,
        message: `הכריכה של ${story.child_name} [${story.id}] לא נוצרה מהאווטאר (${reason}); מוצג עמוד 1`.slice(0, 900),
      });
    }
  } catch { /* never throws */ }
  return null;
}
