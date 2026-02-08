import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `## 🧠 מערכת סיפורי ילדים טיפוליים - NLP & Social Stories

### תפקידך
אתה סופר ילדים ישראלי מקצועי המתמחה ב-NLP (תכנות נוירו-לשוני) וסיפורים חברתיים (Social Stories) לילדים.
מטרתך ליצור תוכן מעצים, טיפולי ומותאם גיל בעברית פשוטה ונגישה.
אתה לא מתרגם מאנגלית - אתה יוצר תוכן מקורי בעברית כמו סופר ילדים ישראלי אמיתי.

## 🌟 עקרונות NLP ושפה מעצימה - קריטי!

### 1. ניסוח חיובי (Positive Phrasing)
- **תמיד התמקד במה לעשות, לא במה לא לעשות**
- נכון: "לדבר בקול רגוע" | לא נכון: "לא לצעוק"
- נכון: "ללכת לאט" | לא נכון: "לא לרוץ"
- נכון: "לנשום עמוק ולהרגיש רגוע" | לא נכון: "לא לפחד"

### 2. מסגור מחדש ועיגון (Reframing & Anchoring)
- הצג אתגרים כהרפתקאות או חוויות חושיות
- הדגש את החוזקות הפנימיות של הגיבור/ה: אומץ, סקרנות, חסד
- בנה את הדימוי העצמי של הילד/ה דרך הדמות

### 3. הנחות יסוד (Presuppositions)
- השתמש בשפה שמניחה הצלחה ויכולת
- נכון: "כשתרגיש/י יותר נוח/ה, תוכל/י לשים לב ש..." 
- נכון: "בכל פעם שתנסה/י, זה יהיה קל יותר"

### 4. התאמה למבנה משפחתי מגוון
- היה רגיש למבנים משפחתיים שונים: הורה יחיד, סבים, שני אבות/אמהות
- אם לא מצוין אחרת, השתמש בניסוח גמיש: "המבוגרים שאוהבים אותו" במקום "אמא ואבא"

## 🔤 שפה עברית פשוטה - קריטי!

### ❌ עברית גבוהה - ❌ אסור!
### ✅ עברית יומיומית ופשוטה - ✅ חובה!

**מבחן ההורה:** אם הורה צריך מילון כדי להבין מילה - אל תשתמש בה!

### דוגמאות למילים אסורות:
| ❌ לא להשתמש | ✅ להשתמש |
|-------------|----------|
| כסות | בגד |
| חרישית | שקט |
| נוגה | אור רך |
| דממה | שקט |
| נחת | שמחה |
| עטרה | כתר |
| התרפקה | חיבקה |
| וכסמה את ראשה | וחבשה קסדה על ראשה |
| כסמה | חבשה קסדה |
| עטתה | לבשה |
| נצמדה | התחברה |
| הביטה | הסתכלה |

### 📝 הסברים למילים מורכבות - חובה!
לכל מילה שאינה יומיומית לחלוטין, **חובה** להוסיף הסבר פשוט בסוגריים מיד אחרי המילה:
- דוגמה: "נחישות (כשלא מוותרים גם כשקשה)"
- דוגמה: "אומץ (כשעושים דברים למרות שקצת מפחדים)"
- דוגמה: "התרגשות (כשהלב דופק מהר משמחה)"
- דוגמה: "סקרנות (כשרוצים לדעת הכל)"

**כלל הסוגריים:** אם ילד בן 5 לא ישמע את המילה בשיחה יומיומית - הוסף הסבר!

## ✅ דקדוק מושלם 100% - קריטי!

- פעלים חייבים להתאים למגדר הדמות (זכר/נקבה) בכל הזמנים
- שמות תואר חייבים להתאים למגדר ולמספר
- כינויי גוף חייבים להתאים למגדר הילד/ה
- **אין טעויות דקדוק בשום מצב!**

### התאמת מגדר:
**זכר:** הלך, רץ, שמח, אמר, ראה, הוא, שלו, אמיץ, חכם
**נקבה:** הלכה, רצה, שמחה, אמרה, ראתה, היא, שלה, אמיצה, חכמה

## 🎨 עקביות ויזואלית ומגדר - חובה!

### נעילת מראה הדמות (Consistency Lock)
- **הגדר את הלבוש פעם אחת** והשאר אותו זהה בכל העמודים
- אין שינויי לבוש בין עמודים!
- אותו צבע שיער, אותו סגנון שיער, אותם בגדים

### סמלים חייבים להתאים למגדר
- **אסור:** כיפה על ילדה (אלא אם ההורה ביקש במפורש)
- **אסור:** סמלים שלא מתאימים למגדר הילד/ה
- תמיד וודא התאמה בין הסמלים החזותיים למגדר

## 👶 מבנה סיפור לפי גיל

### גילאי 0-2 (תינוקות ופעוטות)
- **אורך:** 4 עמודים בלבד (סיפור קצר מאוד!)
- **מילים:** עד 100 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- מיקוד חושי ומרגיע

### גילאי 3-6 (ברירת מחדל)
- **אורך:** 5 עמודים (בינוני)
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- סיבה ותוצאה ברורות
- אינטראקציות חברתיות פשוטות

### גילאי 7-8 (ילדים גדולים)
- **אורך:** 8 עמודים (סיפור מורכב וארוך יותר!)
- **מילים:** אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים ומספר אירועים
- מצבים חברתיים מורכבים יותר
- 3-4 משפטים מפורטים בעמוד
- דמויות משנה ודיאלוגים

## 📚 התאמה אישית - עדיפות מקסימלית!

**אם ההורה סיפק פרטים בשדה החופשי - תעדף אותם ב-100%!**
- הסיפור חייב להתמקד בנושא שנבחר
- יש להעביר מנטרה מעצימה
- אל תסטה מהנושא

## ✍️ מבנה הסיפור - לפי גיל!

**גיל 0-2:** בדיוק 4 עמודים (קצר וממוקד)
**גיל 3-6:** בדיוק 5 עמודים (מבנה קלאסי)
**גיל 7-8:** בדיוק 8 עמודים (סיפור מורכב ועשיר)

כל עמוד מכיל טקסט בהתאם לגיל.

מבנה העלילה (Social Story Format):
1. **עמוד 1:** פתיחה - הצגת הדמות והמצב
2. **עמוד 2:** האתגר - תיאור המצב, הכרה ברגשות
3. **עמודים אמצעיים:** כלים והתפתחות - הדמות מגלה דרך להתמודד
4. **עמוד לפני אחרון:** הצלחה - הדמות משתמשת בכלים ומצליחה
5. **עמוד אחרון:** מנטרה מעצימה - משפט קצר וקליט לזכור

### דוגמאות למנטרה:
- "אני אמיץ/ה ואני יכול/ה!"
- "נשימה עמוקה, והכל בסדר"
- "בכל פעם זה יותר קל"

## 🚫 אסור לחלוטין

- **חרוזים או שירה** - פרוזה בלבד!
- מילים "גבוהות" או ספרותיות ללא הסבר
- המצאת מילים שלא קיימות
- ניסוח שלילי (מה לא לעשות)
- טעויות דקדוק במגדר
- יותר מ-5 עמודים
- שינוי מראה הדמות בין עמודים
- סמלים לא מתאימים למגדר (כיפה לילדה וכו')
- הזכרת "קראו לי" או השמעה קולית

## 🎵 טון כללי
אמפתי, רגוע, תומך ומעצים.

## 🔤 ניקוד
- אם ניקוד = ON: הוסף ניקוד מלא ונכון
- אם ניקוד = OFF: עברית נקייה ללא ניקוד

## ✅ פורמט פלט (חובה)

החזר רק JSON תקין במבנה הזה:
{
  "pages": [
    {
      "page_number": 1,
      "text": "טקסט בעברית פשוטה ונגישה (2-3 משפטים בפרוזה, לא בחרוזים!)",
      "illustration_prompt": "English description including EXACT character appearance: gender, hair color/style, skin tone, clothing. Character must look IDENTICAL in every page."
    }
  ]
}`;

// Hebrew topic translation map for displaying in library
const TOPIC_HEBREW_MAP: Record<string, string> = {
  "space-adventure": "הרפתקה בחלל",
  "magic-kingdom": "ממלכת הקסם",
  "bedtime-story": "סיפור לפני השינה",
  "body-hero-teeth": "צחצוח שיניים",
  "body-hero-bath": "אמבטיה של כיף",
  "body-hero-hands": "שטיפת ידיים",
  "body-hero-nails": "גזירת ציפורניים",
  "pacifier-fairy": "פיית המוצץ",
  "friendship-courage": "חברים בגן",
  "zoo-adventure": "טיול בגן החיות",
  "family-trip": "טיול משפחתי",
  "birthday-party": "מסיבת יום הולדת",
  "clean-room": "לסדר את החדר",
  "potty-training": "גמילה מחיתולים",
  "dentist-visit": "ביקור אצל רופא השיניים",
  "new-sibling": "נולד לי אח/ות",
  "fears": "התמודדות עם פחדים",
  "friends": "חברויות חדשות",
  "kindergarten": "יום ראשון בגן",
  "siblings": "אח או אחות חדשה",
  "confidence": "ביטחון עצמי",
  "nature": "הרפתקה בטבע",
};

// Helper function to translate topic ID to Hebrew
function getHebrewTopic(topicId: string): string {
  return TOPIC_HEBREW_MAP[topicId] || topicId;
}

// Character Profile interface for consistency across illustrations
// This "locked" profile is extracted once and injected into EVERY page illustration
interface CharacterProfile {
  gender: string;
  genderHebrew: string;
  hairDescription: string;
  clothingDescription: string;
  ageDescription: string;
  skinTone: string;
  eyeColor: string;
}

// Helper function to extract character profile from photo using AI
async function extractCharacterProfile(
  childPhoto: string,
  childGender: string,
  ageRange: string,
  apiKey: string
): Promise<CharacterProfile> {
  try {
    const genderHebrew = childGender === "female" ? "ילדה" : "ילד";
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `CRITICAL: Analyze this child's photo and extract detailed visual features for character consistency across a storybook.
Return ONLY a JSON object with these exact fields:
{
  "hair_color": "specific color (e.g., dark brown, light blonde, black, auburn)",
  "hair_style": "specific style (e.g., short curly, long straight with bangs, pigtails, buzz cut)",
  "clothing_color": "primary clothing color",
  "clothing_type": "type of clothing (e.g., red t-shirt, blue dress, green sweater)",
  "skin_tone": "skin tone description (e.g., fair, medium, olive, dark)",
  "eye_color": "eye color if visible (e.g., brown, blue, green)"
}
Be very specific and detailed. This profile will be used to ensure the character looks IDENTICAL in every illustration.
Return only the JSON, no other text.`
              },
              { type: "image_url", image_url: { url: childPhoto } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Profile extraction failed, using defaults");
      return {
        gender: childGender,
        genderHebrew,
        hairDescription: childGender === "female" ? "long brown hair" : "short brown hair",
        clothingDescription: "colorful casual clothes",
        ageDescription: ageRange,
        skinTone: "medium",
        eyeColor: "brown",
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const profile = JSON.parse(cleanedContent);
      
      return {
        gender: childGender,
        genderHebrew: genderHebrew,
        hairDescription: `${profile.hair_color || "brown"} ${profile.hair_style || "hair"}`,
        clothingDescription: `${profile.clothing_color || "colorful"} ${profile.clothing_type || "clothes"}`,
        ageDescription: ageRange,
        skinTone: profile.skin_tone || "medium",
        eyeColor: profile.eye_color || "brown",
      };
    } catch {
      console.log("Could not parse profile, using defaults");
      return {
        gender: childGender,
        genderHebrew: genderHebrew,
        hairDescription: childGender === "female" ? "long brown hair" : "short brown hair",
        clothingDescription: "colorful casual clothes",
        ageDescription: ageRange,
        skinTone: "medium",
        eyeColor: "brown",
      };
    }
  } catch (error) {
    console.error("Error extracting character profile:", error);
    const genderHebrew = childGender === "female" ? "ילדה" : "ילד";
    return {
      gender: childGender,
      genderHebrew: genderHebrew,
      hairDescription: childGender === "female" ? "long brown hair" : "short brown hair",
      clothingDescription: "colorful casual clothes",
      ageDescription: ageRange,
      skinTone: "medium",
      eyeColor: "brown",
    };
  }
}

// Helper function to generate illustration using Lovable AI with character consistency
async function generateIllustration(
  prompt: string,
  childPhoto: string | null,
  characterProfile: CharacterProfile | null,
  apiKey: string,
  adventureLogic?: { outfit: string; background: string; theme: string }
): Promise<string | null> {
  try {
    // Build LOCKED character consistency instruction - this is injected into EVERY page
    // This acts as a "Character Seed" ensuring visual consistency across all illustrations
    const characterSeed = characterProfile 
      ? `CHARACTER_SEED_${characterProfile.gender}_${characterProfile.hairDescription.replace(/\s+/g, '_')}_${characterProfile.skinTone}_${characterProfile.eyeColor}`.toUpperCase()
      : "";
    
    const characterInstruction = characterProfile 
      ? `
=== 🔒 LOCKED CHARACTER PROFILE - DO NOT MODIFY ===
CHARACTER SEED: ${characterSeed}

The main character is a ${characterProfile.gender === "female" ? "girl" : "boy"} aged ${characterProfile.ageDescription}.

MANDATORY APPEARANCE (MUST BE IDENTICAL IN EVERY FRAME):
- Gender: ${characterProfile.gender === "female" ? "Female girl" : "Male boy"}
- Hair: ${characterProfile.hairDescription} (EXACT color and style - never change!)
- Skin: ${characterProfile.skinTone} skin tone (consistent across all lighting)
- Eyes: ${characterProfile.eyeColor} eyes
- Clothing: ${adventureLogic?.outfit || characterProfile.clothingDescription} (same outfit throughout!)

⚠️ CRITICAL: This character MUST be visually IDENTICAL in every single illustration.
The same child, same features, same clothing - as if photographed from different angles.
Any deviation from this profile is a FAILURE.
=== END LOCKED PROFILE ===
`
      : "";
    
    // Build adventure-specific instructions
    const adventureInstruction = adventureLogic
      ? `
=== ADVENTURE THEME REQUIREMENTS ===
- Character outfit: ${adventureLogic.outfit}
- Background/Setting: ${adventureLogic.background}
- Theme/Mood: ${adventureLogic.theme}
=== END ADVENTURE THEME ===
`
      : "";
    
    // MANDATORY STYLE PREFIX - must start every illustration prompt
    const stylePrefix = `In the style of modern 3D Disney-Pixar animation, high resolution, magical atmosphere, magical glowing light, dreamy warm and inviting atmosphere. Characters with large expressive emotional eyes, detailed hair, soft textures.`;
    
    const enhancedPrompt = `${stylePrefix}

${characterInstruction}
${adventureInstruction}
SCENE TO ILLUSTRATE: ${prompt}

STYLE REQUIREMENTS:
- Modern 3D Disney-Pixar animation style (like Coco, Encanto, Inside Out)
- Magical glowing light throughout the scene
- Dreamy, warm, and inviting atmosphere
- Characters with large, expressive emotional eyes
- Detailed hair with realistic textures and flow
- Soft, smooth character textures
- Rich, vibrant colors with warm undertones
- Professional children's book illustration quality
- No text in the image
- MAINTAIN CHARACTER CONSISTENCY: Same face shape, same features, same proportions`;

    let requestBody: any = {
      model: "google/gemini-3-pro-image-preview",
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: childPhoto
            ? [
                { type: "text", text: `Based on this child's photo, create a HIGH QUALITY 3D Disney-Pixar style illustration of them in this scene: ${enhancedPrompt}. CRITICAL: Keep the character's appearance (hair color, hair style, skin tone, clothing) IDENTICAL to the reference photo. This MUST look like a premium children's book illustration.` },
                { type: "image_url", image_url: { url: childPhoto } }
              ]
            : enhancedPrompt
        }
      ]
    };

    console.log("Generating illustration with character consistency...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log("Illustration generated successfully");
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating illustration:", error);
    return null;
  }
}

// Helper function to upload base64 image to Supabase Storage
// Returns the storage PATH (not URL) for private bucket access via signed URLs
async function uploadImageToStorage(
  supabase: any,
  base64Data: string,
  storyId: string,
  pageNumber: number
): Promise<string | null> {
  try {
    // Extract base64 content (remove data:image/png;base64, prefix if present)
    const base64Content = base64Data.includes(",") 
      ? base64Data.split(",")[1] 
      : base64Data;
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const filePath = `${storyId}/page-${pageNumber}.png`;
    
    const { data, error } = await supabase.storage
      .from("story-illustrations")
      .upload(filePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Return the storage PATH (not public URL) since bucket is private
    // Frontend will use SignedImage component to get signed URLs
    console.log("Image uploaded successfully, path:", filePath);
    return filePath;
  } catch (error) {
    console.error("Error in uploadImageToStorage:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "נדרשת התחברות" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with SERVICE_ROLE_KEY for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract token and validate directly with getUser(token)
    const token = authHeader.replace("Bearer ", "");
    console.log("Validating token...");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log("getUser result - user exists:", !!user, "error:", authError?.message);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "טוקן לא תקין או שפג תוקפו" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const userId = user.id;
    // Mask user ID in logs to protect PII
    console.log("Authenticated user:", userId.substring(0, 8) + "...");
    // === END AUTHENTICATION CHECK ===

    const { childName, childGender = "male", ageRange, storyLength = "short", topic, nikud, childPhoto, childAvatarUrl, personalityTraits, adventureLogic } = await req.json();

    // === INPUT VALIDATION ===
    // Validate required fields
    if (!childName || typeof childName !== "string") {
      return new Response(
        JSON.stringify({ error: "שם הילד/ה חסר או לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "נושא הסיפור חסר או לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate string lengths to prevent abuse
    const MAX_NAME_LENGTH = 50;
    const MAX_TOPIC_LENGTH = 500;
    const MAX_TRAITS_LENGTH = 1000;
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB base64

    if (childName.length > MAX_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `שם הילד/ה ארוך מדי (מקסימום ${MAX_NAME_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topic.length > MAX_TOPIC_LENGTH) {
      return new Response(
        JSON.stringify({ error: `נושא הסיפור ארוך מדי (מקסימום ${MAX_TOPIC_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (personalityTraits && personalityTraits.length > MAX_TRAITS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `תיאור התכונות ארוך מדי (מקסימום ${MAX_TRAITS_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (childPhoto && childPhoto.length > MAX_PHOTO_SIZE) {
      return new Response(
        JSON.stringify({ error: "תמונת הילד/ה גדולה מדי (מקסימום 10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate gender
    if (childGender && !["male", "female"].includes(childGender)) {
      return new Response(
        JSON.stringify({ error: "מגדר לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // === END INPUT VALIDATION ===

    console.log("Generating story for:", { childName, childGender, ageRange, storyLength, topic, nikud, hasPhoto: !!childPhoto, hasAvatar: !!childAvatarUrl, hasTraits: !!personalityTraits, hasAdventureLogic: !!adventureLogic });
    
    // Use avatar URL if available (for character consistency), otherwise use original photo
    const effectivePhoto = childAvatarUrl || childPhoto;

    // Use LOVABLE_API_KEY exclusively for ai.gateway.lovable.dev
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("API key not configured");
    }
    
    console.log("Using LOVABLE_API_KEY for AI Gateway");

    const genderText = childGender === "female" ? "ילדה" : "ילד";
    const pronounHe = childGender === "female" ? "היא" : "הוא";
    const pronounHer = childGender === "female" ? "שלה" : "שלו";
    
    // Determine story length based on age AND user preference
    const getAgeLengthInstruction = (age: string, preferredLength: string) => {
      const isLong = preferredLength === "long";
      
      // Age 0-2: Short and simple stories for toddlers
      if (age === "0-2") {
        return {
          pages: isLong ? 5 : 4,
          instruction: isLong 
            ? `- גיל 0-2: סיפור קצר (5 עמודים)
- עד 120 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- דגש על חוויות חושיות ומרגיעות
- כל עמוד: משפט אחד עד שניים!`
            : `- גיל 0-2: סיפור קצר מאוד (4 עמודים בלבד!)
- עד 100 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- דגש על חוויות חושיות ומרגיעות
- כל עמוד: משפט אחד בלבד!`
        };
      } 
      // Age 2-4 (around age 3-4): Medium-length imaginative stories
      else if (age === "2-4") {
        return {
          pages: isLong ? 6 : 5,
          instruction: isLong
            ? `- גיל 3-4: סיפור באורך בינוני-ארוך (6 עמודים)
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- עלילה מפותחת עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות מפורטות`
            : `- גיל 3-4: סיפור באורך בינוני (5 עמודים)
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- סיבה ותוצאה ברורות
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות פשוטות`
        };
      }
      // Age 5-7: Engaging stories with more depth
      else if (age === "5-7") {
        return {
          pages: isLong ? 8 : 6,
          instruction: isLong
            ? `- גיל 5-7: סיפור ארוך ומרתק (8 עמודים)
- עלילה מפותחת עם התחלה, אמצע וסוף דרמטיים
- משפטים מפורטים (3-4 משפטים בעמוד)
- דמויות עם אופי מפותח ועומק
- מסר חינוכי או רגשי משמעותי
- דיאלוגים ואירועים מגוונים
- אוצר מילים עשיר אך נגיש`
            : `- גיל 5-7: סיפור מעניין (6 עמודים)
- עלילה ברורה עם התחלה, אמצע וסוף
- משפטים מפורטים יותר (3 משפטים בעמוד)
- דמויות עם אופי מפותח
- מסר חינוכי או רגשי
- אוצר מילים עשיר אך נגיש`
        };
      }
      // Age 8-10: Complex stories for advanced readers
      else {
        return {
          pages: isLong ? 10 : 8,
          instruction: isLong
            ? `- גיל 8-10: סיפור ארוך ומורכב במיוחד (10 עמודים!)
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים, מתח ומספר אירועים
- מצבים חברתיים מורכבים ומעמיקים
- דמויות משנה רבות ודיאלוגים עשירים
- 4-5 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, התמודדות ולמידה`
            : `- גיל 8-10: סיפור ארוך ומורכב (8 עמודים!)
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים ומספר אירועים
- מצבים חברתיים מורכבים יותר
- דמויות משנה ודיאלוגים עשירים
- 3-4 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, ולמידה`
        };
      }
    };

    const ageLengthConfig = getAgeLengthInstruction(ageRange, storyLength);
    
    // === COMBINED CONTENT LOGIC ===
    // Determine how to frame the story based on what inputs were provided
    let contentFraming = "";
    
    // Check if we have both a structured topic AND a custom description
    const hasStructuredTopic = adventureLogic && topic !== "custom";
    const hasCustomDescription = personalityTraits && personalityTraits.trim().length > 0;
    
    if (hasStructuredTopic && hasCustomDescription) {
      // COMBINATION MODE: Use structured topic as world/setting, custom text as conflict
      contentFraming = `
## 🎭 מצב שילוב - חשוב מאוד!
הנושא המובנה ("${topic}") ישמש כעולם התוכן והתפאורה של הסיפור.
התיאור החופשי שכתב ההורה ישמש כקונפליקט המרכזי בעלילה.

**עולם הסיפור:** ${adventureLogic.theme}
**סביבה:** ${adventureLogic.background}
**לבוש:** ${adventureLogic.outfit}

**הקונפליקט שצריך לשלב בעלילה:**
${personalityTraits}

הדמות תחווה את האירוע/הקונפליקט בתוך עולם התוכן שנבחר.
`;
    } else if (hasStructuredTopic) {
      // STRUCTURED TOPIC ONLY: Classic story based on the topic
      contentFraming = `
## 📚 סיפור קלאסי
צור סיפור קלאסי על הנושא שנבחר.
**עולם הסיפור:** ${adventureLogic.theme}
**סביבה:** ${adventureLogic.background}
**לבוש:** ${adventureLogic.outfit}
`;
    } else if (hasCustomDescription) {
      // CUSTOM DESCRIPTION ONLY: Original story based on the description
      contentFraming = `
## ✍️ סיפור מקורי
צור סיפור מקורי המבוסס על התיאור החופשי שנתן ההורה:
${personalityTraits}

התאם את עולם הסיפור והסביבה לתוכן שתואר.
`;
    }
    
    const userPrompt = `## הוראות יצירת סיפור

**פרטי הילד/ה:**
- שם: ${childName}
- מגדר: ${genderText}
- גיל: ${ageRange}

${contentFraming}

**נושא הסיפור:** ${topic}
${hasCustomDescription ? `**תיאור חופשי:** ${personalityTraits}` : ""}

**ניקוד:** ${nikud ? "כן - הוסף ניקוד מלא ונכון לכל המילים" : "לא - ללא ניקוד"}

## דקדוק מגדרי - קריטי!
המגדר הוא: ${childGender === "female" ? "נקבה" : "זכר"}

**חובה להשתמש בצורות הנכונות:**
- כינויי גוף: ${pronounHe}, ${pronounHer}
- פעלים בעבר: ${childGender === "female" ? "הלכה, רצתה, שמחה, אמרה, ראתה, עשתה" : "הלך, רץ, שמח, אמר, ראה, עשה"}
- פעלים בהווה: ${childGender === "female" ? "הולכת, רצה, שמחה, אומרת, רואה, עושה" : "הולך, רץ, שמח, אומר, רואה, עושה"}
- תארים: ${childGender === "female" ? "שמחה, עייפה, נרגשת, אמיצה, חכמה" : "שמח, עייף, נרגש, אמיץ, חכם"}

## מבנה הסיפור לפי גיל - קריטי!
**צור בדיוק ${ageLengthConfig.pages} עמודים!** לא יותר, לא פחות.

**הנחיות אורך וסגנון לפי גיל ${ageRange}:**
${ageLengthConfig.instruction}

## הנחיות איור
${adventureLogic ? `
- הדמות חייבת ללבוש: ${adventureLogic.outfit}
- הרקע חייב להיות: ${adventureLogic.background}
- הנושא הכללי: ${adventureLogic.theme}
` : ''}

## איכות השפה - קריטי!
- כתוב כמו סופר ילדים ישראלי אמיתי
- אסור משפטים שנשמעים מתורגמים
- השתמש בביטויים ישראליים טבעיים ויומיומיים
- פיסוק נכון: נקודה בסוף משפט, פסיק בין חלקי משפט
- אין לציין "קראו לי" או השמעה קולית - הסיפור מיועד לקריאה עצמאית!

## תיקוני שפה חובה:
- במקום "וכסמה את ראשה" → "וחבשה קסדה על ראשה"
- במקום "כסמה" → "חבשה קסדה"
- במקום "עטתה" → "לבשה"
- במקום "הביטה" → "הסתכלה"
- הוסף הסברים בסוגריים למילים מורכבות!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "הגעתם למגבלת הבקשות. נסו שוב בעוד מספר דקות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום. אנא צרו קשר עם התמיכה." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב מאוחר יותר.");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
    }

    console.log("AI response received, parsing...");

    let storyData;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      
      // Remove markdown json code blocks
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      
      cleanedContent = cleanedContent.trim();
      
      storyData = JSON.parse(cleanedContent);
      
      // Validate story structure
      if (!storyData.pages || !Array.isArray(storyData.pages) || storyData.pages.length === 0) {
        console.error("Invalid story structure:", storyData);
        throw new Error("Invalid story structure from AI");
      }
      
      console.log(`Story parsed successfully with ${storyData.pages.length} pages`);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      console.error("Parse error:", e);
      throw new Error("Invalid JSON response from AI");
    }

    // Use existing supabase client for database operations

    // Create the story first - include user_id for gallery privacy
    // Set generation_status to 'generating_illustrations' - illustrations will be created async
    // Save topic in Hebrew for library display
    const hebrewTopic = getHebrewTopic(topic);
    
    const storyInsertData: any = {
      child_name: childName,
      child_gender: childGender,
      age_range: ageRange,
      topic: hebrewTopic, // Store Hebrew topic for display
      nikud: nikud,
      generation_status: "generating_illustrations",
    };
    
    // Only add user_id if we have one (for gallery privacy)
    if (userId) {
      storyInsertData.user_id = userId;
    }
    
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert(storyInsertData)
      .select()
      .single();

    if (storyError) {
      console.error("Error creating story:", storyError);
      throw storyError;
    }

    console.log("Story created:", story.id);

    // Insert pages WITHOUT illustrations first (text only)
    // Illustrations will be generated asynchronously
    const pagesWithoutIllustrations = storyData.pages.map((page: any) => ({
      story_id: story.id,
      page_number: page.page_number,
      text: page.text,
      illustration_prompt: page.illustration_prompt,
      illustration_url: null, // Will be filled by generate-illustrations
    }));

    const { error: pagesError } = await supabase
      .from("story_pages")
      .insert(pagesWithoutIllustrations);

    if (pagesError) {
      console.error("Error creating pages:", pagesError);
      throw pagesError;
    }

    console.log("Story pages created (text only), triggering illustration generation...");

    // Fire-and-forget: Trigger illustration generation in background
    // This function will run separately and update the pages with illustrations
    // Note: supabaseUrl is already defined above at line ~465, reusing it
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured! Illustration generation will fail.");
      // Update story status to indicate problem
      await supabase
        .from("stories")
        .update({ generation_status: "failed" })
        .eq("id", story.id);
    } else {
      console.log(`Triggering generate-illustrations for story ${story.id}...`);
      
      fetch(`${supabaseUrl}/functions/v1/generate-illustrations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: story.id,
          childPhoto: childPhoto,
          childAvatarUrl: childAvatarUrl,
          childGender: childGender,
          ageRange: ageRange,
          adventureLogic: adventureLogic,
        }),
      }).then(response => {
        console.log(`generate-illustrations response status: ${response.status}`);
        if (!response.ok) {
          response.text().then(text => {
            console.error("generate-illustrations error response:", text);
          });
        }
      }).catch(err => {
        console.error("Error triggering illustration generation:", err);
        // Don't throw - the story text is already saved
      });
    }

    console.log("Illustration generation triggered, returning storyId immediately");

    return new Response(
      JSON.stringify({ 
        storyId: story.id,
        message: "Story text created, illustrations generating in background",
        status: "generating_illustrations"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-story:", error);
    // Return generic error message to client, keep details in server logs
    const userMessage = error instanceof Error && error.message.startsWith("שגיאה") 
      ? error.message 
      : "שגיאה בעיבוד הבקשה. נסו שוב מאוחר יותר.";
    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
