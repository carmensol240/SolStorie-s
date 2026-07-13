import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const log: any[] = [];
  const push = (m: string, extra?: any) => { console.log(m, extra ?? ""); log.push({ m, extra }); };

  const email = `sanity-fallback-${Date.now()}@test.local`;
  const password = "TestPass!" + Math.random().toString(36).slice(2, 10);
  let userId: string | null = null;
  let storyId: string | null = null;

  try {
    // 1. Create user
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (cErr || !created.user) throw new Error("createUser: " + cErr?.message);
    userId = created.user.id;
    push("Created user", { userId, email });

    // 2. Grant credits
    await admin.from("profiles").update({ story_credits: 3 }).eq("id", userId);
    push("Granted 3 story credits");

    // 3. Sign in to get access_token
    const anon = createClient(supabaseUrl, anonKey);
    const { data: sess, error: sErr } = await anon.auth.signInWithPassword({ email, password });
    if (sErr || !sess.session) throw new Error("signIn: " + sErr?.message);
    const token = sess.session.access_token;

    // 4. Call generate-story (age 4-6 => odd-page illustrations)
    push("Calling generate-story...");
    const genRes = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        childName: "טסט",
        childGender: "male",
        ageRange: "5-7",
        topic: "יום בגן",
        language: "he",
        nikud: false,
      }),
    });
    const genBody = await genRes.json().catch(() => ({}));
    push(`generate-story HTTP ${genRes.status}`, genBody);
    storyId = genBody.storyId || genBody.story_id || genBody.id || null;
    if (!storyId) throw new Error("No storyId returned");

    // 5. Poll story_pages for illustration_prompt + illustration_url
    const start = Date.now();
    let pages: any[] = [];
    while (Date.now() - start < 180_000) {
      const { data } = await admin
        .from("story_pages")
        .select("page_number, text, illustration_prompt, illustration_url")
        .eq("story_id", storyId)
        .order("page_number");
      pages = data || [];
      const requiredPages = pages.filter(p => p.page_number % 2 === 1);
      const allIllustrated = requiredPages.length > 0 &&
        requiredPages.every(p => p.illustration_url);
      if (allIllustrated) break;
      await new Promise(r => setTimeout(r, 5000));
    }

    // 6. Verify
    const required = pages.filter(p => p.page_number % 2 === 1);
    const evenPages = pages.filter(p => p.page_number % 2 === 0);
    const missingPrompt = required.filter(p => !p.illustration_prompt);
    const missingImage = required.filter(p => !p.illustration_url);
    const evenWithPrompt = evenPages.filter(p => p.illustration_prompt);

    // 7. Check fallback log count for this user
    const { data: fallbackLogs } = await admin
      .from("error_logs")
      .select("id, error_message, metadata, created_at")
      .eq("user_id", userId)
      .eq("error_type", "illustration_prompt_fallback");

    const report = {
      storyId,
      totalPages: pages.length,
      requiredIllustrationPages: required.map(p => p.page_number),
      evenPagesTextOnly: evenPages.map(p => p.page_number),
      missingPromptOnRequired: missingPrompt.map(p => p.page_number),
      missingImageOnRequired: missingImage.map(p => p.page_number),
      evenPagesThatGotPrompt: evenWithPrompt.map(p => p.page_number),
      fallbackTriggered: (fallbackLogs?.length || 0) > 0,
      fallbackLogCount: fallbackLogs?.length || 0,
      fallbackDetails: fallbackLogs,
      pagesPreview: pages.map(p => ({
        page: p.page_number,
        hasPrompt: !!p.illustration_prompt,
        hasImage: !!p.illustration_url,
        textSample: (p.text || "").slice(0, 40),
      })),
    };
    push("Report", report);

    // 8. Cleanup
    if (storyId) {
      await admin.from("story_pages").delete().eq("story_id", storyId);
      await admin.from("stories").delete().eq("id", storyId);
      // Try clean illustrations storage
      try {
        const { data: files } = await admin.storage.from("story-illustrations").list(storyId);
        if (files && files.length) {
          await admin.storage.from("story-illustrations").remove(files.map(f => `${storyId}/${f.name}`));
        }
      } catch (_) {}
    }
    if (userId) {
      await admin.from("error_logs").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
    push("Cleanup done");

    return new Response(JSON.stringify({ success: true, report, log }, null, 2), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    push("ERROR: " + (e as Error).message);
    // Best-effort cleanup
    try {
      if (storyId) {
        await admin.from("story_pages").delete().eq("story_id", storyId);
        await admin.from("stories").delete().eq("id", storyId);
      }
      if (userId) {
        await admin.from("error_logs").delete().eq("user_id", userId);
        await admin.from("profiles").delete().eq("id", userId);
        await admin.auth.admin.deleteUser(userId);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ success: false, error: (e as Error).message, log }, null, 2), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});