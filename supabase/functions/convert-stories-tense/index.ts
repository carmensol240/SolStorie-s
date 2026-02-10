import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONVERSION_PROMPT = `אתה עורך לשוני מקצועי בעברית. המשימה שלך היא להמיר טקסט מזמן עבר לזמן הווה.

כללים:
1. המר את כל הפעלים מזמן עבר לזמן הווה
2. שמור על המגדר המקורי (זכר/נקבה)
3. שמור על הניקוד אם קיים
4. אל תשנה את תוכן הסיפור, רק את זמן הפעלים
5. שמור על אורך הטקסט דומה
6. דוגמאות: "הלך" → "הולך", "אמרה" → "אומרת", "הרגיש" → "מרגיש", "גילתה" → "מגלה", "ראה" → "רואה"

החזר רק את הטקסט המומר, ללא הסברים נוספים.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "נדרשת התחברות" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing AI API key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { limit = 10, offset = 0, dry_run = true } = await req.json();

    // Fetch story pages
    const { data: pages, error: pagesError } = await supabase
      .from("story_pages")
      .select("id, text, story_id, page_number")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (pagesError) {
      return new Response(JSON.stringify({ error: pagesError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ page_id: string; original: string; converted: string; updated: boolean }> = [];

    for (const page of pages || []) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: CONVERSION_PROMPT },
              { role: "user", content: page.text },
            ],
          }),
        });

        if (!response.ok) {
          console.error(`AI conversion failed for page ${page.id}`);
          results.push({ page_id: page.id, original: page.text, converted: page.text, updated: false });
          continue;
        }

        const data = await response.json();
        const convertedText = data.choices?.[0]?.message?.content?.trim() || page.text;

        if (!dry_run && convertedText !== page.text) {
          const { error: updateError } = await supabase
            .from("story_pages")
            .update({ text: convertedText })
            .eq("id", page.id);

          if (updateError) {
            console.error(`Update failed for page ${page.id}:`, updateError);
            results.push({ page_id: page.id, original: page.text, converted: convertedText, updated: false });
            continue;
          }
        }

        results.push({
          page_id: page.id,
          original: page.text,
          converted: convertedText,
          updated: !dry_run && convertedText !== page.text,
        });

        // Rate limit: wait between API calls
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error processing page ${page.id}:`, err);
        results.push({ page_id: page.id, original: page.text, converted: page.text, updated: false });
      }
    }

    return new Response(JSON.stringify({
      dry_run,
      total_processed: results.length,
      total_updated: results.filter(r => r.updated).length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
