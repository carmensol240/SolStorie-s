import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "נדרשת התחברות" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "טוקן לא תקין או שפג תוקפו" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // === END AUTHENTICATION CHECK ===

    // Rate limit by user ID (more reliable than IP)
    const rateLimit = checkRateLimit(user.id, "enhance-text", RATE_LIMITS.aiFunction);
    if (!rateLimit.allowed) {
      // Mask user ID in logs to protect PII
      console.log(`Enhance text rate limit exceeded for user: ${user.id.substring(0, 8)}...`);
      return rateLimitResponse(rateLimit, corsHeaders, "יותר מדי בקשות. נסה שוב מאוחר יותר.");
    }

    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation - max 5,000 characters
    const MAX_TEXT_LENGTH = 5000;
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `הטקסט ארוך מדי (מקסימום ${MAX_TEXT_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `אתה משורר ילדים מוכשר. התפקיד שלך הוא לשדרג טקסט סיפור ילדים לגרסה יותר שירית ומרהיבה.

כללים חשובים:
1. שמור על המשמעות המקורית של הטקסט
2. הוסף חרוזים כשמתאים ונכון
3. השתמש בשפה עשירה, יפה וציורית
4. שמור על אורך דומה לטקסט המקורי (אל תאריך יותר מדי)
5. התאם לקהל ילדים בגילאי 3-10
6. החזר רק את הטקסט המשודרג, ללא הסברים או הערות נוספות`;

    console.log('Enhancing text:', text.substring(0, 100) + '...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `שדרג את הטקסט הבא לגרסה שירית ומרהיבה יותר:\n\n${text}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'הגעת למגבלת הבקשות, נסה שוב מאוחר יותר' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'נדרשת תוספת קרדיטים' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'שגיאה בשדרוג הטקסט' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const enhancedText = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedText) {
      console.error('No enhanced text in response:', data);
      return new Response(
        JSON.stringify({ error: 'לא התקבל טקסט משודרג' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enhanced text successfully');

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-text function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
