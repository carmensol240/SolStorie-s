import { isAvatarCoverUrl } from "../_shared/avatar-cover.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { logError } from "../_shared/log-error.ts";
import { refreshStoryReadiness } from "../_shared/story-readiness.ts";
import { formatRule } from "../_shared/illustration-format.ts";
import { buildIllustrationPrompt, referenceContent, faceShare, type PromptHero, type PromptRefs } from "../_shared/illustration-prompt.ts";
import { checkRedrawPicture, redrawDecision, redrawFixInstruction, MAX_STYLE_REDRAWS } from "../_shared/style-check.ts";
import { notifyIllustrationIssue } from "../_shared/illustration-alert.ts";
import { pickFramingAngle, framingComposition, usesConsistentFraming } from "../_shared/camera-framing.ts";
import { reserveRedraws, releaseRedraws, REDRAW_LIMIT_MESSAGE_HE } from "../_shared/redraw-limit.ts";
import { avatarWinsRule, normalizeHairShade, realAgeText, usesAvatarTraits, usesLikeness } from "../_shared/avatar-traits.ts";
import { mergeAppearance, hairToEnglish, clothingToEnglish, buildCharacterLock, kippahForStory } from "../_shared/appearance.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  PIXAR_STYLE,
  NEGATIVE_PROMPT,
  NEGATIVE_PROMPT_FULL,
  CAST_NEGATIVE_PROMPT,
  CHARACTER_BASE_REFS,
  getSolUrl,
  CAST_DESCRIPTIONS,
  LEO_REF_URL,
  leoOnPage,
  leoRefNote,
  CHARACTER_CONSISTENCY_PROMPT,
  buildOutfitLock,
  SINGLE_HERO_RULE,
  genderSymbolRestriction,
  negativePromptFor,
  buildGenderHeader,
  storyTextForPrompt,
} from "../_shared/style-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Deterministic seed per story — keeps the seed-capable fallback (Flux Schnell)
// stable across every page of the same story.
function seedFromStoryId(storyId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < storyId.length; i++) {
    hash ^= storyId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 2147483647;
}

import { buildMilitaryLock, militaryRoleForStory } from "../_shared/military-family.ts";
import { castInText, castReferenceBlock, pageCastRule } from "../_shared/story-cast-pages.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storyId, pageId, customPrompt, mode, choice, referencePage } = await req.json();
    console.log(`[retry-illustration] request story=${storyId} page=${pageId} mode=${mode ?? "default"} choice=${choice ?? "-"} user=${user.id}`);
    if (!storyId || !pageId) {
      return new Response(JSON.stringify({ error: "Missing storyId or pageId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admins (server-checked) may redraw any story; never charged and never counted for the owner.
    // Admin in demo mode is treated like a parent.
    let isAdmin = false;
    {
      const { data: adminRow, error: adminErr } = await supabase
        .rpc("is_effective_admin", { _user_id: user.id });
      if (adminErr) console.warn("[retry-illustration] admin lookup failed:", adminErr.message);
      isAdmin = !!adminRow;
    }

    // Verify story ownership (or admin)
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("id, user_id, child_id, child_photo_path, child_gender, age_range, child_name, topic, page1_regen_used, page1_regen_lock_at, story_outfit, kippah, kippah_color, illustration_format, created_at, hero_hair_shade, hero_eye_color, hero_skin_tone, hero_traits, cover_url")
      .eq("id", storyId)
      .maybeSingle();

    if (storyError || !story || (story.user_id !== user.id && !isAdmin)) {
      return new Response(JSON.stringify({ error: "Story not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the page
    const { data: page, error: pageError } = await supabase
      .from("story_pages")
      .select("*")
      .eq("id", pageId)
      .eq("story_id", storyId)
      .maybeSingle();

    if (pageError || !page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Page-1 one-shot regeneration =====
    // Page 1 doubles as the book cover, so users get exactly ONE redo attempt.
    // The flag `page1_regen_used` is only flipped AFTER the new image is safely in
    // storage — a failed generation leaves it false so the user can try again.
    const isPage1Regen = mode === "page1_regen" || mode === "page1_confirm";

    // Admins get unlimited page-1 retries for QA purposes (isAdmin is checked above).
    // The story owner's data (children, photo, lock) is always read by the story's own user_id.
    const ownerId: string = story.user_id;
    if (isAdmin) console.log(`[retry-illustration] admin redraw admin=${user.id} owner=${ownerId} story=${storyId} mode=${mode ?? "default"}`);
    // Redrawing an arbitrary page (no mode) is admin-only; parents only get the page-1 one-shot.
    if (!isPage1Regen && !isAdmin) {
      console.warn(`[retry-illustration] refused no-mode redraw for non-admin user=${user.id} story=${storyId}`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const candidatePath = `${storyId}/page-1-candidate.png`;
    const finalPage1Path = `${storyId}/page-1.png`;
    const publicUrl = (path: string) =>
      supabase.storage.from("story-illustrations").getPublicUrl(path).data.publicUrl;

    if (isPage1Regen && page.page_number !== 1) {
      return new Response(JSON.stringify({ error: "mode is only valid for page 1" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2 of the flow: user picked which version to keep.
    if (mode === "page1_confirm") {
      if (choice === "new") {
        const { data: blob, error: dlErr } = await supabase.storage
          .from("story-illustrations").download(candidatePath);
        if (dlErr || !blob) {
          return new Response(JSON.stringify({ error: "Candidate image not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from("story-illustrations")
          .upload(finalPage1Path, bytes, { contentType: "image/png", upsert: true });
        if (upErr) {
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Page 1 IS the cover — keep both pointers identical.
        await supabase.from("story_pages").update({ illustration_url: `${finalPage1Path}?v=${Date.now()}`, print_illustration_url: null, print_illustration_width: null }).eq("id", pageId);
        if (!isAvatarCoverUrl((story as any).cover_url)) {
          await supabase.from("stories")
            .update({ cover_url: `${publicUrl(finalPage1Path)}?v=${Date.now()}` })
            .eq("id", storyId);
        }
      }
      await supabase.storage.from("story-illustrations").remove([candidatePath]).catch(() => {});
      return new Response(
        JSON.stringify({ success: true, illustrationUrl: finalPage1Path, kept: choice === "new" ? "new" : "old" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let lockAcquired = false;
    if (mode === "page1_regen") {
      if (!isAdmin && (story as any).page1_regen_used) {
        return new Response(JSON.stringify({ error: "already_used" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Atomic double-click guard. Each conditional UPDATE is atomic on its own,
      // so only ONE concurrent request can win. We run two typed-filter updates
      // instead of a raw `.or()` string (which breaks on the ISO timestamp's
      // reserved characters): first "no lock", then "stale lock" (>3 minutes).
      const staleBefore = new Date(Date.now() - 3 * 60_000).toISOString();
      const tryLock = async (variant: "free" | "stale") => {
        let q = supabase
          .from("stories")
          .update({ page1_regen_lock_at: new Date().toISOString() })
          .eq("id", storyId)
          .eq("user_id", ownerId);
        // Non-admins: the quota flag is part of the atomic guard.
        if (!isAdmin) q = q.eq("page1_regen_used", false);
        q = variant === "free"
          ? q.is("page1_regen_lock_at", null)
          : q.lt("page1_regen_lock_at", staleBefore);
        return await q.select("id");
      };

      let { data: locked, error: lockError } = await tryLock("free");
      if (!lockError && (!locked || locked.length === 0)) {
        ({ data: locked, error: lockError } = await tryLock("stale"));
      }

      if (lockError) {
        // A failed query is NOT "someone else is running" — surface it instead of
        // masking it behind a misleading 409.
        console.error(`[page1_regen] lock query failed story=${storyId}:`, lockError);
        return new Response(JSON.stringify({ error: "lock_failed", details: lockError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!locked || locked.length === 0) {
        console.warn(`[page1_regen] lock not acquired (another run in progress) story=${storyId}`);
        return new Response(JSON.stringify({ error: "in_progress" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lockAcquired = true;
    }

    // Parent redraw limits (per page / per story). Admins are never limited.
    let redrawIds: string[] = [];
    if (!isAdmin) {
      const reserved = await reserveRedraws(supabase, storyId, user.id, [page.page_number], "retry-illustration");
      if (reserved === null) {
        if (lockAcquired) {
          await supabase.from("stories").update({ page1_regen_lock_at: null }).eq("id", storyId);
        }
        return new Response(JSON.stringify({ error: REDRAW_LIMIT_MESSAGE_HE, code: "REDRAW_LIMIT" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      redrawIds = reserved;
    }

    const releaseLock = async () => {
      if (lockAcquired) {
        await supabase.from("stories").update({ page1_regen_lock_at: null }).eq("id", storyId);
        lockAcquired = false;
      }
    };

    const failure = async (message: string, status = 500) => {
      await releaseLock(); // generation failed → flag stays false, user may retry
      await releaseRedraws(supabase, redrawIds).catch(() => {}); // a failed try does not count
      return new Response(JSON.stringify({ error: message }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    // Face reference: the child's AVATAR is the only face reference whenever it exists — the real
    // photo (photo_url) is never sent then. Lookup: avatar of the linked child (by id, else by name),
    // then the story's saved reference path, then the child's photo, then the owner's profile.
    let childPhoto: string | null = null;
    let photoSource = "none";
    let childRow: any = null;
    {
      let q = supabase.from("children").select("age, hair_color, hair_style, clothing_type, clothing_color, avatar_url, photo_url").eq("user_id", ownerId);
      q = (story as any).child_id ? q.eq("id", (story as any).child_id) : q.eq("name", story.child_name);
      const { data } = await q.limit(1).maybeSingle();
      childRow = data;
    }
    let photoPath: string | null = null;
    if (childRow?.avatar_url) { photoPath = childRow.avatar_url; photoSource = "avatar"; }
    else if ((story as any).child_photo_path) { photoPath = (story as any).child_photo_path; photoSource = "story"; }
    else if (childRow?.photo_url) { photoPath = childRow.photo_url; photoSource = "photo"; }
    else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("child_photo_url, child_avatar_url")
        .eq("id", ownerId)
        .maybeSingle();
      photoPath = profile?.child_avatar_url || profile?.child_photo_url || null;
      if (photoPath) photoSource = profile?.child_avatar_url ? "profile_avatar" : "profile_photo";
    }

    if (photoPath) {
      if (photoPath.startsWith("http") || photoPath.startsWith("data:")) {
        childPhoto = photoPath;
      } else {
        const { data: signedData } = await supabase.storage
          .from("child-photos")
          .createSignedUrl(photoPath, 600);
        if (signedData?.signedUrl) childPhoto = signedData.signedUrl;
      }
    }

    // The AI provider cannot fetch signed storage URLs (URL_ERROR) — inline as base64.
    if (childPhoto && childPhoto.includes("/storage/v1/object/sign/")) {
      try {
        const imgRes = await fetch(childPhoto);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) {
            bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          }
          childPhoto = `data:${imgRes.headers.get("content-type") || "image/jpeg"};base64,${btoa(bin)}`;
        } else {
          await imgRes.text();
        }
      } catch (e) {
        console.warn("Could not inline child photo:", e);
      }
    }
    console.log(`🖼️ face reference: ${childPhoto ? photoSource : "none"}`);

    // Page reference (clothes + 3D render style only when there is a face reference).
    // An admin may name another page whose finished art is the reference; everyone else uses page 1.
    const refPageNumber = isAdmin && Number.isInteger(referencePage) && referencePage > 0 && referencePage !== page.page_number
      ? referencePage as number
      : 1;
    let pageOneReferenceUrl: string | null = null;
    {
      const { data: firstPage } = await supabase
        .from("story_pages")
        .select("illustration_url")
        .eq("story_id", storyId)
        .eq("page_number", refPageNumber)
        .maybeSingle();
      const raw = (firstPage as { illustration_url?: string } | null)?.illustration_url;
      if (raw) {
        pageOneReferenceUrl = raw.startsWith("http")
          ? raw.split("?")[0]
          : supabase.storage.from("story-illustrations").getPublicUrl(raw).data?.publicUrl || null;
      }
      console.log(`🔗 page-${refPageNumber} reference: ${pageOneReferenceUrl ? "found" : "not available"}`);
    }

    // ===== One shared instruction (same builder as first drawings) =====
    const ap = mergeAppearance(null, {
      hairColor: childRow?.hair_color, hairStyle: childRow?.hair_style,
      clothingType: childRow?.clothing_type, clothingColor: childRow?.clothing_color,
    });
    const outfit = ((story as any).story_outfit || clothingToEnglish(ap, (story as any).child_gender) || "");
    const kp = kippahForStory(story as any);
    const traitsOn = usesAvatarTraits((story as any).created_at);
    const ageText = realAgeText(childRow?.age, (story as any).age_range);
    const sh = normalizeHairShade((story as any).hero_hair_shade);
    const traits = traitsOn && sh && (story as any).hero_eye_color && (story as any).hero_skin_tone
      ? { hair: sh, eyes: (story as any).hero_eye_color, skin: (story as any).hero_skin_tone } : null;
    const likenessOn = usesLikeness((story as any).created_at);
    const heroFeatures: string[] = likenessOn && Array.isArray((story as any).hero_traits) ? (story as any).hero_traits : [];
    const storyFormat: string | null = (story as any).illustration_format ?? null;
    const hero: PromptHero = {
      gender: (story as any).child_gender, ageText, outfit, kippah: kp.kippah, kippahColor: kp.color,
      lookText: childPhoto ? "" : hairToEnglish(ap),
      traits: childPhoto ? traits : null,
      features: childPhoto ? heroFeatures : null,
    };
    const visualDescription = customPrompt || page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
    // Family member in the reserves/army: fixed IDF uniform, never weapons or gear.
    const militaryRole = militaryRoleForStory(story.topic, String((page as any).text || ""));
    const militaryLock = militaryRole ? buildMilitaryLock(militaryRole, String((page as any).text || ""), String(visualDescription)) : "";
    // Cast comes only from the page text (plus an admin's own prompt): official look, each once, others not drawn.
    const castText = `${(page as any).text || ""}\n${customPrompt || ""}`;
    const withLeo = castInText(castText, story.child_name).includes("leo");
    const pageRules = [castReferenceBlock(castText, story.child_name), pageCastRule(castText, story.child_name), militaryLock];
    const pageNarrative = ((page as any).text || "").toString().slice(0, 400);
    const { data: lastRow } = await supabase.from("story_pages").select("page_number").eq("story_id", storyId).order("page_number", { ascending: false }).limit(1).maybeSingle();
    const consistent = usesConsistentFraming((story as any).created_at);
    const cameraAngle = pickFramingAngle(page.page_number, (lastRow as any)?.page_number ?? null, 0, consistent, likenessOn);
    const sceneParts = [
      pageNarrative
        ? `SCENE (MUST MATCH THE STORY TEXT EXACTLY — illustrate precisely what happens in this page, not a different action):
${storyTextForPrompt(pageNarrative)}
VISUAL DESCRIPTION: ${visualDescription}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above. Do not invent a different scene.`
        : `SCENE (THIS IS THE MOST IMPORTANT PART — illustrate THIS specific scene in detail): ${visualDescription}`,
      `CAMERA: ${cameraAngle}. ${framingComposition(cameraAngle, consistent, likenessOn)}`,
    ];
    if (page.page_number === 1 && !isAvatarCoverUrl((story as any).cover_url)) {
      // Older stories: page 1 is also cropped into the square library cover card.
      sceneParts.push(`COMPOSITION (COVER SAFE ZONE): The main character is centered in the frame, full body visible, with at least 15% empty margin on every side and extra headroom at the top. Nothing important touches the edges — this image is also cropped to a square cover card.`);
    }
    const refs: PromptRefs = { face: !!childPhoto, canon: !!pageOneReferenceUrl, canonPage: refPageNumber, leo: withLeo };
    const promptFor = (fix: string) => buildIllustrationPrompt({
      refs, hero, scene: sceneParts.join("\n\n"), rules: pageRules, formatRule: formatRule((story as any).illustration_format), fix,
    });

    let modelUsed = "unknown";
    let fallbackReason: string | undefined;
    const genStart = Date.now();
    const fluxSeed = seedFromStoryId(storyId);
    const hasVisualReference = !!childPhoto || !!pageOneReferenceUrl;

    const logImageGenCall = (api: string, model: string, prompt: string, seed: number | null) =>
      console.log(
        `[IMG-GEN] story=${storyId} page=${page.page_number} api=${api} model=${model} ` +
          `refs=[face:${childPhoto ? "yes" : "no"}(${photoSource}), page${refPageNumber}:${pageOneReferenceUrl ? "yes" : "no"}] ` +
          `seed=${seed ?? "n/a"} promptChars=${prompt.length} faceShare=${faceShare(prompt)}% promptHead="${prompt.substring(0, 200).replace(/\s+/g, " ")}"`,
      );

    // One drawing. With any reference picture: the main service (Flux ignores references and would
    // draw a different child). Without any reference: Flux text-only.
    const drawOnce = async (fix: string, attempts: number, timeoutMs: number): Promise<{ image: string | null; model: string }> => {
      const prompt = promptFor(fix);
      if (hasVisualReference) {
        const content = referenceContent({ face: childPhoto, canon: pageOneReferenceUrl, leo: withLeo ? LEO_REF_URL : null }, prompt);
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            logImageGenCall("lovable-gateway/chat-completions", "google/gemini-3-pro-image", prompt, null);
            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              signal: AbortSignal.timeout(Math.max(30_000, timeoutMs)),
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model: "google/gemini-3-pro-image", modalities: ["image", "text"], messages: [{ role: "user", content }] }),
            });
            if (!response.ok) {
              const errorBody = await response.text().catch(() => "no body");
              console.error(`Gemini attempt ${attempt} failed: ${response.status} - ${errorBody}`);
              fallbackReason = `Gemini with reference failed: HTTP ${response.status}`;
              await logError("illustration_retry_error", `retry Gemini ${response.status}`, { status: response.status, body: errorBody.slice(0, 500), storyId, page: page?.page_number, source: "retry-illustration" });
              if (attempt < attempts) { await new Promise(r => setTimeout(r, 3000)); continue; }
              break;
            }
            const data = await response.json();
            const img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
            if (img) return { image: img, model: childPhoto ? "gemini_with_face" : "gemini_with_page1_ref" };
            console.warn(`Gemini attempt ${attempt}: no image in response`);
            if (attempt < attempts) { await new Promise(r => setTimeout(r, 3000)); continue; }
          } catch (fetchErr) {
            console.error(`Gemini attempt ${attempt} error:`, fetchErr);
            if (attempt < attempts) { await new Promise(r => setTimeout(r, 3000)); continue; }
          }
        }
        return { image: null, model: "unknown" };
      }
      const FAL_KEY = Deno.env.get("FAL_KEY");
      if (!FAL_KEY) return { image: null, model: "unknown" };
      fallbackReason = fallbackReason || "No child photo available";
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          logImageGenCall("fal.run/fal-ai/flux/schnell", "flux-schnell", prompt, fluxSeed);
          const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
            method: "POST",
            signal: AbortSignal.timeout(30_000),
            headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, image_size: "portrait_4_3", num_inference_steps: 4, num_images: 1, enable_safety_checker: true, seed: fluxSeed }),
          });
          if (!response.ok) {
            const errorBody = await response.text().catch(() => "no body");
            await logError("illustration_retry_error", `retry Flux ${response.status}`, { status: response.status, body: errorBody.slice(0, 500), storyId, source: "retry-illustration" });
            continue;
          }
          const falImageUrl = (await response.json()).images?.[0]?.url;
          if (!falImageUrl) continue;
          const imgResponse = await fetch(falImageUrl);
          if (!imgResponse.ok) { await imgResponse.text(); continue; }
          const buf = new Uint8Array(await imgResponse.arrayBuffer());
          let bin = "";
          for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          return { image: `data:image/png;base64,${btoa(bin)}`, model: "fal_schnell_fallback" };
        } catch (fetchErr) {
          console.error(`Schnell attempt ${attempt} error:`, fetchErr);
        }
      }
      return { image: null, model: "unknown" };
    };

    // Page-1 one-shot without any reference: never draw a different child.
    if (!hasVisualReference && isPage1Regen) {
      return await failure("לא נמצאה תמונת ייחוס לדמות, ולכן לא ניתן ליצור מחדש את איור עמוד 1 בלי לשנות את הילד/ה.", 422);
    }

    // ===== Mandatory checks: 3D Pixar style + face vs the face reference, up to MAX_STYLE_REDRAWS redraws =====
    // Time budget: the browser waits for this answer (~150 s platform cut-off).
    const REDRAW_START_LIMIT_MS = 85_000;
    const HARD_LIMIT_MS = 140_000;
    const checkOpts = { age: ageText, hair: traits?.hair, features: heroFeatures, format: storyFormat, allowText: String(story.topic || "").startsWith("letter-") || String(story.topic || "").startsWith("number-") };
    const tries: { image: string; model: string; problems: string[]; reason: string }[] = [];
    let fix = "";
    for (let round = 0; round <= MAX_STYLE_REDRAWS; round++) {
      const elapsed = Date.now() - genStart;
      if (round > 0 && elapsed > REDRAW_START_LIMIT_MS) {
        console.warn(`[STYLE-CHECK] story=${storyId} page=${page.page_number} no time for redraw ${round} (${elapsed}ms)`);
        break;
      }
      const g = await drawOnce(fix, round === 0 ? 2 : 1, Math.min(120_000, HARD_LIMIT_MS - elapsed - 15_000));
      if (!g.image) break;
      const v = await checkRedrawPicture(g.image, childPhoto, LOVABLE_API_KEY, checkOpts);
      const problems = v ? v.problems : ["check unavailable"];
      tries.push({ image: g.image, model: g.model, problems, reason: v?.reason || "check unavailable" });
      console.log(`[STYLE-CHECK] story=${storyId} page=${page.page_number} try ${round + 1}: ${problems.length ? problems.join(", ") : "pass"}`);
      if (!problems.length) break;
      fix = redrawFixInstruction(problems, { age: ageText, hair: traits?.hair, features: heroFeatures, format: storyFormat });
    }

    const durationMs = Date.now() - genStart;
    if (!tries.length) {
      console.log(`[IMG-GEN-RESULT] story=${storyId} page=${page.page_number} success=false reason="${fallbackReason || "no image"}"`);
      return await failure(isPage1Regen ? "יצירת האיור נכשלה. נסי שוב בעוד רגע — הניסיון שלך לא נוצל." : "No image generated after retries", isPage1Regen ? 502 : 500);
    }

    // page1_regen never replaces anything until the parent chooses, so it counts as "had a picture".
    const hadExisting = isPage1Regen || !!page.illustration_url;
    const decision = redrawDecision(tries, { hadExisting, pageNumber: page.page_number });
    const last = tries[tries.length - 1];
    if (decision.action === "keep_old" || decision.action === "hold") {
      const problemsText = last.reason.slice(0, 200);
      await supabase.from("illustration_logs").insert({
        story_id: storyId, page_number: page.page_number,
        model_used: decision.action === "keep_old" ? "kept_previous" : "held_mismatch",
        fallback_reason: `redraw failed the 3D Pixar / face check after ${tries.length} tries: ${problemsText}`,
        had_face_reference: !!childPhoto, had_page1_reference: !!pageOneReferenceUrl, camera_angle: cameraAngle,
        duration_ms: durationMs, attempts: tries.length,
        identity_check: `redraw failed, ${decision.action === "keep_old" ? "old kept" : "held"}: ${problemsText}`.slice(0, 300), identity_retried: tries.length > 1,
      });
      await notifyIllustrationIssue(supabase, storyId, page.page_number,
        `ציור מחדש לא עבר את בדיקת הסגנון/הפנים אחרי ${tries.length} ניסיונות (${problemsText}); ${decision.action === "keep_old" ? "האיור הקודם נשאר בעמוד" : "העמוד נשאר בלי איור וממתין לטיפול"}`, true);
      const msg = isPage1Regen
        ? "לא הצלחנו ליצור איור שעובר את בדיקת האיכות. האיור הקודם נשאר — הניסיון שלך לא נוצל."
        : "הציור החדש לא עבר את בדיקת הסגנון והפנים, ולכן האיור הקודם נשאר.";
      await releaseLock();
      await releaseRedraws(supabase, redrawIds).catch(() => {});
      return new Response(JSON.stringify({ error: msg, code: "QUALITY_CHECK_FAILED", problems: last.problems }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const chosen = tries[decision.index];
    const imageUrl = chosen.image;
    modelUsed = chosen.model;
    const identityCheck = decision.action === "save"
      ? (decision.index === 0 ? "match" : `match after redraw ${decision.index}`)
      : decision.identityCheck;
    if (decision.action === "save_closest") {
      await notifyIllustrationIssue(supabase, storyId, page.page_number,
        `עמוד 1 נשמר עם האיור הכי קרוב, אבל לא עבר את בדיקת הסגנון/הפנים (${chosen.problems.join(", ")}) – דורש טיפול`, true);
    }
    console.log(`[IMG-GEN-RESULT] story=${storyId} page=${page.page_number} success=true model=${modelUsed} durationMs=${durationMs} check="${identityCheck}"`);


    // Upload to storage
    const base64Content = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // In one-shot page-1 mode the new art lands on a candidate path first, so the user can
    // compare it with the original before anything is overwritten.
    const filePath = mode === "page1_regen" ? candidatePath : `${storyId}/page-${page.page_number}.png`;
    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return await failure("Upload failed");
    }

    if (mode === "page1_regen") {
      // Image is safely stored → NOW the one-shot attempt counts as used.
      // Only reference-based models count; a referenceless fallback must never burn the attempt.
      // Admins are exempt: never mark the flag so the story stays clean for re-testing.
      const referenceBased = !isAdmin && modelUsed.startsWith("gemini_");
      await supabase
        .from("stories")
        .update({ page1_regen_used: referenceBased, page1_regen_lock_at: null })
        .eq("id", storyId);
      lockAcquired = false;
    } else {
      const v = Date.now();
      await supabase
        .from("story_pages")
        .update({ illustration_url: `${filePath.split("?")[0]}?v=${v}`, print_illustration_url: null, print_illustration_width: null })
        .eq("id", pageId);
      // Page 1 IS the cover (library card + share page) — keep both pointers identical.
      if (page.page_number === 1 && !isAvatarCoverUrl((story as any).cover_url)) {
        await supabase.from("stories").update({ cover_url: `${publicUrl(filePath)}?v=${v}` }).eq("id", storyId);
      }
    }

    // Log the illustration generation
    await supabase.from("illustration_logs").insert({
      story_id: storyId,
      page_number: page.page_number,
      model_used: modelUsed,
      fallback_reason: fallbackReason || null,
      had_face_reference: !!childPhoto,
      had_page1_reference: !!pageOneReferenceUrl,
      camera_angle: cameraAngle,
      duration_ms: durationMs,
      attempts: tries.length,
      identity_check: identityCheck,
      identity_retried: tries.length > 1,
    });

    console.log(`✅ Retry illustration success for page ${page.page_number} (model: ${modelUsed})`);
    // A story waiting for admin ("needs_attention") becomes ready once every page has a picture.
    await refreshStoryReadiness(supabase, storyId, { onlyIfNeedsAttention: true });

    return new Response(
      JSON.stringify({
        success: true,
        illustrationUrl: filePath,
        ...(mode === "page1_regen"
          ? { candidateUrl: `${publicUrl(candidatePath)}?v=${Date.now()}`, regenUsed: true }
          : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("retry-illustration error:", error);
    await logError("illustration_retry_error", `retry-illustration crash: ${(error as Error)?.message || error}`, { source: "retry-illustration" });
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
