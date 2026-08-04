import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === OPTIONAL AUTHENTICATION - use for rate limiting ===
    let rateLimitKey = "anonymous";
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          rateLimitKey = user.id;
        }
      } catch (e) {
        console.log("Auth check failed, falling back to IP rate limit");
      }
    }
    
    if (rateLimitKey === "anonymous") {
      rateLimitKey = getClientIP(req) || "unknown";
    }

    // Rate limit
    const rateLimit = checkRateLimit(rateLimitKey, "add-nikud", RATE_LIMITS.aiFunction);
    if (!rateLimit.allowed) {
      console.log(`Add nikud rate limit exceeded for: ${rateLimitKey.substring(0, 8)}...`);
      return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation - max 10,000 characters
    const MAX_TEXT_LENGTH = 10000;
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `הטקסט ארוך מדי (מקסימום ${MAX_TEXT_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Adding nikud to text:", text.substring(0, 100) + "...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `אתה מומחה לניקוד עברי. התפקיד שלך הוא להוסיף ניקוד מלא ומדויק לטקסט בעברית.

כללים:
1. החזר רק את הטקסט עם הניקוד, ללא הסברים או תוספות
2. שמור על כל המילים והמשפטים המקוריים
3. הוסף ניקוד מלא לכל מילה (פתח, קמץ, צירי, סגול, חולם, שורוק, קובוץ, חיריק, שווא)
4. הוסף דגש כשצריך
5. אל תשנה סימני פיסוק או רווחים
6. אם יש מילים שכבר מנוקדות, השאר אותן כפי שהן
7. 🚨 קריטי: מותר להוסיף אך ורק סימני ניקוד. אסור בהחלט להוסיף, למחוק או להחליף אותיות. שמות פרטיים קצרים (למשל "ארי") חייבים להישאר בדיוק באותן אותיות — אסור להפוך אותם למילה דומה ("אריה", "אראי" וכד')`,
          },
          {
            role: "user",
            content: `הוסף ניקוד מלא לטקסט הבא:\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות. אנא נסה שוב מאוחר יותר." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום. אנא הוסף קרדיטים לחשבון." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let nikudText = data.choices?.[0]?.message?.content?.trim();

    if (!nikudText) {
      throw new Error("No response from AI");
    }

    // === LETTER-SKELETON GUARD ===
    // Nikud may only add vowel marks. Revert any word whose letters were changed
    // (this is what turned the name "ארי" into "אריה"/"אראי" between pages).
    const stripNikud = (s: string) => s.replace(/[\u0591-\u05C7]/g, "");
    const origTokens = text.split(/(\s+)/);
    const nikudTokens = nikudText.split(/(\s+)/);
    if (origTokens.length === nikudTokens.length) {
      let reverted = 0;
      for (let i = 0; i < origTokens.length; i++) {
        if (/^\s*$/.test(origTokens[i])) continue;
        if (stripNikud(nikudTokens[i]) !== stripNikud(origTokens[i])) {
          console.warn(`Nikud guard: reverting "${stripNikud(nikudTokens[i])}" → "${stripNikud(origTokens[i])}"`);
          nikudTokens[i] = origTokens[i];
          reverted++;
        }
      }
      if (reverted > 0) console.warn(`Nikud guard: reverted ${reverted} altered word(s)`);
      nikudText = nikudTokens.join("");
    } else {
      console.warn("Nikud guard: token count mismatch — returning original text");
      nikudText = text;
    }

    console.log("Nikud added successfully");

    return new Response(
      JSON.stringify({ nikudText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in add-nikud function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
