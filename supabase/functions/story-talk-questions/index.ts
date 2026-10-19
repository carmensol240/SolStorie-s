// Returns stories.talk_questions; when missing (English or older stories) makes them once and saves them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { gatewayEditorCall } from "../_shared/hebrew-editor.ts";
import { generateTalkQuestions } from "../_shared/talk-questions.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "auth required" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "auth required" }, 401);

    const { storyId } = await req.json().catch(() => ({}));
    if (typeof storyId !== "string" || !/^[0-9a-f-]{36}$/i.test(storyId)) return json({ error: "storyId required" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: story } = await admin.from("stories")
      .select("id, user_id, child_name, child_gender, topic, language, nikud, talk_questions")
      .eq("id", storyId).maybeSingle();
    if (!story) return json({ error: "not found" }, 404);
    if (story.user_id !== user.id) {
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!isAdmin) return json({ error: "forbidden" }, 403);
    }
    if (Array.isArray(story.talk_questions) && story.talk_questions.length) return json({ questions: story.talk_questions });

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ questions: [] });
    const { data: pages } = await admin.from("story_pages").select("page_number, text").eq("story_id", storyId).order("page_number");
    const questions = await generateTalkQuestions({
      call: gatewayEditorCall(key, 60_000),
      language: story.language,
      heroName: story.child_name,
      gender: story.child_gender || "female",
      topic: story.topic,
      pages: (pages || []).map((p) => p.text),
    });
    if (questions.length) {
      // only fill when still empty (two tabs at once never overwrite each other)
      await admin.from("stories").update({ talk_questions: questions }).eq("id", storyId).is("talk_questions", null);
    }
    return json({ questions });
  } catch (e) {
    console.error("story-talk-questions", e);
    return json({ questions: [] });
  }
});
