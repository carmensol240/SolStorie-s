import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function swapGenderWithAI(text: string, targetGender: "male" | "female"): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.warn("LOVABLE_API_KEY not found, using fallback regex swap");
    return swapGenderWithRegex(text, targetGender);
  }

  const genderInstruction = targetGender === "female" 
    ? "השב את הטקסט כשהדמות הראשית היא ילדה (נקבה). החלף את כל הפעלים, כינויי הגוף והתארים לצורת נקבה." 
    : "השב את הטקסט כשהדמות הראשית היא ילד (זכר). החלף את כל הפעלים, כינויי הגוף והתארים לצורת זכר.";

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `אתה מומחה בעברית. המשימה שלך היא לשנות את מגדר הדמות הראשית בסיפור.

כללים חשובים:
1. שנה רק את מגדר הדמות הראשית (הילד/הילדה שהסיפור עליו/ה)
2. החלף פעלים (הלך→הלכה), כינויים (הוא→היא, שלו→שלה), ותארים (שמח→שמחה)
3. אל תשנה דמויות אחרות בסיפור (הורים, חברים, חיות)
4. שמור על הסגנון, הניקוד והפיסוק המקוריים
5. אל תוסיף או תסיר תוכן
6. החזר רק את הטקסט המתוקן, ללא הסברים`
          },
          { 
            role: "user", 
            content: `${genderInstruction}

הטקסט המקורי:
${text}` 
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return swapGenderWithRegex(text, targetGender);
    }

    const data = await response.json();
    const correctedText = data.choices?.[0]?.message?.content?.trim();

    if (!correctedText) {
      console.warn("Empty AI response, using fallback");
      return swapGenderWithRegex(text, targetGender);
    }

    return correctedText;
  } catch (error) {
    console.error("AI swap error:", error);
    return swapGenderWithRegex(text, targetGender);
  }
}

// Fallback regex-based swap
const GENDER_SWAP_RULES = {
  male_to_female: {
    "הוא": "היא", "שלו": "שלה", "אותו": "אותה", "לו": "לה",
    "בו": "בה", "ממנו": "ממנה", "עליו": "עליה", "אליו": "אליה",
    "איתו": "איתה", "הלך": "הלכה", "רץ": "רצה", "אמר": "אמרה",
    "ראה": "ראתה", "עשה": "עשתה", "יצא": "יצאה", "בא": "באה",
    "ישב": "ישבה", "עמד": "עמדה", "קם": "קמה", "שכב": "שכבה",
    "אכל": "אכלה", "שתה": "שתתה", "ישן": "ישנה", "התעורר": "התעוררה",
    "לקח": "לקחה", "נתן": "נתנה", "שמע": "שמעה", "ידע": "ידעה",
    "רצה": "רצתה", "יכול": "יכלה", "צריך": "צריכה", "חשב": "חשבה",
    "הרגיש": "הרגישה", "הבין": "הבינה", "החליט": "החליטה",
    "התחיל": "התחילה", "סיים": "סיימה", "גמר": "גמרה", "מצא": "מצאה",
    "חיפש": "חיפשה", "בחר": "בחרה", "פתח": "פתחה", "סגר": "סגרה",
    "נכנס": "נכנסה", "עלה": "עלתה", "ירד": "ירדה", "חזר": "חזרה",
    "הגיע": "הגיעה", "נסע": "נסעה", "טס": "טסה", "קפץ": "קפצה",
    "רקד": "רקדה", "שר": "שרה", "צייר": "ציירה", "כתב": "כתבה",
    "קרא": "קראה", "למד": "למדה", "שיחק": "שיחקה", "צחק": "צחקה",
    "בכה": "בכתה", "חייך": "חייכה", "הסתכל": "הסתכלה",
    "הביט": "הביטה", "דיבר": "דיברה", "סיפר": "סיפרה",
    "שאל": "שאלה", "ענה": "ענתה", "עזר": "עזרה", "אהב": "אהבה",
    "פחד": "פחדה", "נבהל": "נבהלה", "התרגש": "התרגשה",
    "נרגע": "נרגעה", "נהנה": "נהנתה", "נפל": "נפלה",
    "התלבש": "התלבשה", "התרחץ": "התרחצה",
    "שמח": "שמחה", "עצוב": "עצובה", "אמיץ": "אמיצה",
    "פוחד": "פוחדת", "חכם": "חכמה", "טוב": "טובה",
    "גדול": "גדולה", "קטן": "קטנה", "חזק": "חזקה",
    "מהיר": "מהירה", "איטי": "איטית", "עייף": "עייפה",
    "רעב": "רעבה", "צמא": "צמאה", "בריא": "בריאה",
    "מבולבל": "מבולבלת", "מופתע": "מופתעת", "מאושר": "מאושרת",
    "מודאג": "מודאגת", "נרגש": "נרגשת", "ביישן": "ביישנית",
    "מיוחד": "מיוחדת", "נפלא": "נפלאה", "מדהים": "מדהימה",
    "מקסים": "מקסימה", "חמוד": "חמודה", "מתוק": "מתוקה",
    "אהוב": "אהובה", "מוכן": "מוכנה", "עסוק": "עסוקה",
    "מלא": "מלאה", "חדש": "חדשה", "צעיר": "צעירה",
    "גיבור": "גיבורה", "ילד": "ילדה", "בן": "בת",
    "נסיך": "נסיכה", "מלך": "מלכה", "חבר": "חברה", "תלמיד": "תלמידה",
  },
  female_to_male: {} as Record<string, string>,
};

// Generate reverse mappings
Object.entries(GENDER_SWAP_RULES.male_to_female).forEach(([male, female]) => {
  GENDER_SWAP_RULES.female_to_male[female] = male;
});

function swapGenderWithRegex(text: string, targetGender: "male" | "female"): string {
  const rules = targetGender === "female" 
    ? GENDER_SWAP_RULES.male_to_female 
    : GENDER_SWAP_RULES.female_to_male;
  
  let result = text;
  const sortedEntries = Object.entries(rules).sort((a, b) => b[0].length - a[0].length);
  
  for (const [from, to] of sortedEntries) {
    const regex = new RegExp(`(?<![א-ת])${from}(?![א-ת])`, "g");
    result = result.replace(regex, to);
  }
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "יש להתחבר כדי להחליף מגדר" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "אימות נכשל" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { storyId, targetGender } = await req.json();

    if (!storyId || !targetGender) {
      return new Response(
        JSON.stringify({ error: "חסרים פרמטרים נדרשים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (targetGender !== "male" && targetGender !== "female") {
      return new Response(
        JSON.stringify({ error: "מגדר לא חוקי" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Gender swap request: storyId=${storyId}, targetGender=${targetGender}, userId=${user.id.substring(0, 8)}...`);

    // Verify story ownership
    const { data: story, error: storyError } = await supabaseAdmin
      .from("stories")
      .select("id, user_id, child_gender")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: "הסיפור לא נמצא" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (story.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "אין הרשאה לערוך סיפור זה" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (story.child_gender === targetGender) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "המגדר כבר מוגדר נכון",
          updatedPages: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all story pages
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from("story_pages")
      .select("id, text, page_number")
      .eq("story_id", storyId)
      .order("page_number", { ascending: true });

    if (pagesError) {
      console.error("Error fetching pages:", pagesError);
      return new Response(
        JSON.stringify({ error: "שגיאה בשליפת עמודי הסיפור" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pages?.length || 0} pages to process with AI`);

    // Process each page with AI
    const updatedPages: { id: string; text: string }[] = [];
    
    for (const page of (pages || [])) {
      console.log(`Processing page ${page.page_number}...`);
      const newText = await swapGenderWithAI(page.text, targetGender);
      updatedPages.push({ id: page.id, text: newText });
    }

    // Update pages in database
    for (const update of updatedPages) {
      const { error: updateError } = await supabaseAdmin
        .from("story_pages")
        .update({ text: update.text })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Error updating page ${update.id}:`, updateError);
      }
    }

    // Update story's child_gender
    const { error: storyUpdateError } = await supabaseAdmin
      .from("stories")
      .update({ child_gender: targetGender })
      .eq("id", storyId);

    if (storyUpdateError) {
      console.error("Error updating story gender:", storyUpdateError);
    }

    console.log(`Successfully swapped gender to ${targetGender} for ${updatedPages.length} pages using AI`);

    return new Response(
      JSON.stringify({
        success: true,
        message: targetGender === "female" 
          ? "הטקסט הותאם לגיבורה בהצלחה! ✨" 
          : "הטקסט הותאם לגיבור בהצלחה! ✨",
        updatedPages: updatedPages.length,
        targetGender,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Gender swap error:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בהחלפת המגדר" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
