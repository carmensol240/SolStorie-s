import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Comprehensive Hebrew gender swap rules
const GENDER_SWAP_RULES = {
  male_to_female: {
    // Pronouns
    "הוא": "היא",
    "שלו": "שלה",
    "אותו": "אותה",
    "לו": "לה",
    "בו": "בה",
    "ממנו": "ממנה",
    "עליו": "עליה",
    "אליו": "אליה",
    "איתו": "איתה",
    
    // Past tense verbs (common)
    "הלך": "הלכה",
    "רץ": "רצה",
    "אמר": "אמרה",
    "ראה": "ראתה",
    "עשה": "עשתה",
    "יצא": "יצאה",
    "בא": "באה",
    "ישב": "ישבה",
    "עמד": "עמדה",
    "קם": "קמה",
    "שכב": "שכבה",
    "אכל": "אכלה",
    "שתה": "שתתה",
    "ישן": "ישנה",
    "התעורר": "התעוררה",
    "לקח": "לקחה",
    "נתן": "נתנה",
    "שמע": "שמעה",
    "ידע": "ידעה",
    "רצה": "רצתה",
    "יכול": "יכלה",
    "צריך": "צריכה",
    "חשב": "חשבה",
    "הרגיש": "הרגישה",
    "הבין": "הבינה",
    "החליט": "החליטה",
    "התחיל": "התחילה",
    "סיים": "סיימה",
    "גמר": "גמרה",
    "מצא": "מצאה",
    "חיפש": "חיפשה",
    "בחר": "בחרה",
    "פתח": "פתחה",
    "סגר": "סגרה",
    "נכנס": "נכנסה",
    "יצא": "יצאה",
    "עלה": "עלתה",
    "ירד": "ירדה",
    "חזר": "חזרה",
    "הגיע": "הגיעה",
    "נסע": "נסעה",
    "טס": "טסה",
    "שחה": "שחתה",
    "קפץ": "קפצה",
    "רקד": "רקדה",
    "שר": "שרה",
    "צייר": "ציירה",
    "כתב": "כתבה",
    "קרא": "קראה",
    "למד": "למדה",
    "שיחק": "שיחקה",
    "ניצח": "ניצחה",
    "הפסיד": "הפסידה",
    "צחק": "צחקה",
    "בכה": "בכתה",
    "חייך": "חייכה",
    "הסתכל": "הסתכלה",
    "הביט": "הביטה",
    "דיבר": "דיברה",
    "סיפר": "סיפרה",
    "שאל": "שאלה",
    "ענה": "ענתה",
    "עזר": "עזרה",
    "אהב": "אהבה",
    "שנא": "שנאה",
    "פחד": "פחדה",
    "נבהל": "נבהלה",
    "התרגש": "התרגשה",
    "נרגע": "נרגעה",
    "נהנה": "נהנתה",
    "סבל": "סבלה",
    "נפל": "נפלה",
    "קם": "קמה",
    "התלבש": "התלבשה",
    "התרחץ": "התרחצה",
    "אכל": "אכלה",
    
    // Adjectives
    "שמח": "שמחה",
    "עצוב": "עצובה",
    "אמיץ": "אמיצה",
    "פוחד": "פוחדת",
    "חכם": "חכמה",
    "טוב": "טובה",
    "רע": "רעה",
    "גדול": "גדולה",
    "קטן": "קטנה",
    "יפה": "יפה",
    "חזק": "חזקה",
    "חלש": "חלשה",
    "מהיר": "מהירה",
    "איטי": "איטית",
    "עייף": "עייפה",
    "רעב": "רעבה",
    "צמא": "צמאה",
    "בריא": "בריאה",
    "חולה": "חולה",
    "מבולבל": "מבולבלת",
    "מופתע": "מופתעת",
    "מאושר": "מאושרת",
    "מודאג": "מודאגת",
    "נרגש": "נרגשת",
    "גאה": "גאה",
    "ביישן": "ביישנית",
    "אמיתי": "אמיתית",
    "מיוחד": "מיוחדת",
    "נפלא": "נפלאה",
    "מדהים": "מדהימה",
    "מקסים": "מקסימה",
    "חמוד": "חמודה",
    "מתוק": "מתוקה",
    "אהוב": "אהובה",
    "מוכן": "מוכנה",
    "עסוק": "עסוקה",
    "פנוי": "פנויה",
    "מלא": "מלאה",
    "ריק": "ריקה",
    "חדש": "חדשה",
    "ישן": "ישנה",
    "צעיר": "צעירה",
    "זקן": "זקנה",
    
    // Nouns
    "גיבור": "גיבורה",
    "ילד": "ילדה",
    "בן": "בת",
    "נסיך": "נסיכה",
    "מלך": "מלכה",
    "חבר": "חברה",
    "תלמיד": "תלמידה",
    "ילד קטן": "ילדה קטנה",
    "ילד חמוד": "ילדה חמודה",
  },
  female_to_male: {} as Record<string, string>,
};

// Generate reverse mappings
Object.entries(GENDER_SWAP_RULES.male_to_female).forEach(([male, female]) => {
  GENDER_SWAP_RULES.female_to_male[female] = male;
});

function swapGenderInText(text: string, targetGender: "male" | "female"): string {
  const rules = targetGender === "female" 
    ? GENDER_SWAP_RULES.male_to_female 
    : GENDER_SWAP_RULES.female_to_male;
  
  let result = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedEntries = Object.entries(rules).sort((a, b) => b[0].length - a[0].length);
  
  for (const [from, to] of sortedEntries) {
    // Use word boundaries for Hebrew
    const regex = new RegExp(`(?<![א-ת])${from}(?![א-ת])`, "g");
    result = result.replace(regex, to);
  }
  
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header and validate user
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

    // Parse request body
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

    // Check if gender is already correct
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

    console.log(`Found ${pages?.length || 0} pages to process`);

    // Swap gender in all pages
    const updates = (pages || []).map((page) => ({
      id: page.id,
      text: swapGenderInText(page.text, targetGender),
    }));

    // Update pages in database
    for (const update of updates) {
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

    console.log(`Successfully swapped gender to ${targetGender} for ${updates.length} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        message: targetGender === "female" 
          ? "הטקסט הותאם לגיבורה בהצלחה!" 
          : "הטקסט הותאם לגיבור בהצלחה!",
        updatedPages: updates.length,
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
