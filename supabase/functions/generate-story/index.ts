import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logError } from "../_shared/log-error.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Wardrobe drift detection (logging only, never blocks a story) ───

const WARDROBE_ITEMS = [
  "t-shirt", "tshirt", "shirt", "cape", "dress", "overalls", "pants", "trousers",
  "shorts", "skirt", "boots", "sneakers", "shoes", "hat", "cap", "jacket", "coat",
  "pajamas", "pyjamas", "suit", "belt", "gloves", "crown", "headband", "scarf",
  "leggings", "tights", "hoodie", "sweater", "vest", "robe", "swimsuit",
];

const WARDROBE_COLORS = [
  "red", "blue", "yellow", "green", "purple", "pink", "white", "black", "gold",
  "golden", "silver", "orange", "brown", "grey", "gray", "turquoise", "beige",
];

/** Extract normalized `color item` wardrobe tokens from an illustration prompt. */
export function extractWardrobeTokens(prompt: string): Set<string> {
  const tokens = new Set<string>();
  if (!prompt) return tokens;
  const text = prompt.toLowerCase().replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ");
  for (const item of WARDROBE_ITEMS) {
    const re = new RegExp(`(?:(${WARDROBE_COLORS.join("|")})\\s+(?:\\w+\\s+){0,2})?\\b${item}\\b`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      tokens.add(m[1] ? `${m[1]} ${item}` : item);
    }
  }
  return tokens;
}

const WARDROBE_CHANGE_HINTS = [
  "פיג'מ", "פיג׳מ", "פיגמ", "מעיל", "מתלבש", "מתלבשת", "מחליף", "מחליפה",
  "בגד ים", "בגדי ים", "מחליפים בגדים", "לובש מעיל", "מתכסה",
  "pajama", "pyjama", "coat", "raincoat", "changes into", "changed into",
  "swimsuit", "swimming suit", "puts on",
];

function hasExplicitWardrobeChange(pageText: string): boolean {
  const t = (pageText || "").toLowerCase();
  return WARDROBE_CHANGE_HINTS.some((h) => t.includes(h));
}

/**
 * Compares wardrobe tokens across pages that have an illustration_prompt and
 * logs a warning for any unexplained deviation from page 1's outfit.
 * Detection only — never mutates prompts and never blocks the story.
 */
function checkWardrobeDrift(
  pages: Array<{ page_number: number; text: string; illustration_prompt: string | null }>,
  storyId: string,
): void {
  const withPrompts = pages
    .filter((p) => p.illustration_prompt && String(p.illustration_prompt).trim() !== "")
    .sort((a, b) => a.page_number - b.page_number);
  if (withPrompts.length < 2) return;

  const baselineTokens = extractWardrobeTokens(withPrompts[0].illustration_prompt as string);
  if (baselineTokens.size === 0) return;
  const baseline = [...baselineTokens];
  const baselineItems = new Map<string, string>(); // item -> color (or "")
  for (const tok of baseline) {
    const parts = tok.split(" ");
    const item = parts[parts.length - 1];
    const color = parts.length > 1 ? parts[0] : "";
    if (color || !baselineItems.has(item)) baselineItems.set(item, color);
  }

  let driftedPages = 0;
  for (const page of withPrompts.slice(1)) {
    const found = extractWardrobeTokens(page.illustration_prompt as string);
    if (found.size === 0) continue;
    if (hasExplicitWardrobeChange(page.text)) continue;

    const foundItems = new Map<string, string>();
    for (const tok of found) {
      const parts = tok.split(" ");
      const item = parts[parts.length - 1];
      const color = parts.length > 1 ? parts[0] : "";
      if (color || !foundItems.has(item)) foundItems.set(item, color);
    }

    const missing: string[] = [];
    const recolored: string[] = [];
    for (const [item, color] of baselineItems) {
      if (!foundItems.has(item)) {
        missing.push(color ? `${color} ${item}` : item);
      } else {
        const newColor = foundItems.get(item) || "";
        if (color && newColor && newColor !== color) {
          recolored.push(`${item}: ${color} -> ${newColor}`);
        }
      }
    }

    if (missing.length > 0 || recolored.length > 0) {
      driftedPages += 1;
      console.warn("[WARDROBE_DRIFT]", JSON.stringify({
        storyId,
        page: page.page_number,
        baseline,
        found: [...found],
        missing,
        recolored,
      }));
    }
  }

  console.log(
    `[WARDROBE_DRIFT] summary: ${driftedPages}/${withPrompts.length - 1} illustrated pages deviated from page ${withPrompts[0].page_number} outfit (story ${storyId})`,
  );
}

const SYSTEM_PROMPT = `## 🚨🚨🚨 META-INSTRUCTION: BEFORE WRITING ANY WORD, VERIFY IT EXISTS IN A STANDARD HEBREW DICTIONARY (Even-Shoshan). IF YOU CANNOT CONFIRM WITH 100% CERTAINTY THAT A WORD EXISTS - DO NOT USE IT. THIS OVERRIDES ALL OTHER INSTRUCTIONS. EVERY INVENTED WORD DISQUALIFIES THE ENTIRE STORY. OUTPUT MUST BE 100% HEBREW. Any word in Arabic, English, or any other language immediately disqualifies the story. אם שפת הסיפור היא עברית — כל הטקסט חייב להיות בעברית בלבד, ללא אף מילה באנגלית או בשפה אחרת. אין לערבב שפות בשום מקרה. 🚨🚨🚨

## ⚠️ CRITICAL HEBREW TEXT QUALITY RULES — MUST FOLLOW ALL (NON-NEGOTIABLE):

### LANGUAGE & VOCABULARY:
- Use ONLY simple, modern, child-friendly Hebrew. Zero exceptions.
- FORBIDDEN words: 'אפיו' (use 'אפילו'), 'אשר' (use 'ש'), 'כי אם' (use 'אלא'), and any biblical/archaic Hebrew.
- Every word must be understandable to a child of the target age without explanation.
- Vocabulary must precisely match the age range: 0-2 (single words / very short), 3-6 (simple sentences), 7-8 (slightly more complex), 9-12 (richer language but still clear).

### GRAMMAR & ACCURACY:
- Perfect subject/verb/gender agreement in every sentence — check every single sentence.
- No grammatical errors whatsoever — not even minor ones.
- No double negatives.
- Active voice always preferred over passive voice.
- Characters' names, gender, and traits must be 100% consistent across ALL pages of the story.

### NIKUD (VOWELIZATION):
- Nikud must be 100% accurate based on context.
- CRITICAL distinctions: 'הַשָּׁנָה' (year) vs 'הַשֵּׁנָה' (sleep), 'רָאָה' (saw) vs 'רָעָה' (evil), 'שָׁלוֹם' vs 'שֶׁלוֹ' — always verify meaning before adding nikud.
- Every word's nikud must match its exact meaning in context.

### STORY QUALITY:
- Every sentence must flow naturally and rhythmically when read aloud.
- Sentences must be short, clear, and engaging for children.
- The story must have a clear beginning, middle, and end with logical progression.
- Emotional connection — every page must make the child feel something (joy, curiosity, warmth).
- The child protagonist's name must appear naturally and warmly throughout.
- Story content must be 100% age-appropriate, positive, and educational.
- No contradictions between pages — maintain full narrative consistency.

### BEFORE FINALIZING EACH PAGE — VERIFY:
✓ Is every word child-friendly?
✓ Is grammar perfect?
✓ Is nikud correct for this specific context?
✓ Does this page connect naturally to the previous one?
✓ Would a child enjoy hearing this sentence read aloud?

## 🧠 מערכת סיפורי ילדים טיפוליים - שירת ילדים מקצועית

### 🎨 כללי סגנון כתיבה — חובה מוחלטת!

#### הסגנון הנדרש:
- **עברית יומיומית, חמה וטבעית** — כמו שהורה ישראלי מדבר עם ילדו לפני השינה. לא ספרותית, לא כבדה, לא מליצית.
- **משפטים קצרים וקצביים — כל משפט בשורה חדשה.** לא גושי טקסט! כל משפט מסתיים בנקודה ועובר לשורה הבאה.
- **שפה חושית** — תאר ריחות, צלילים, תחושות מישוש, אור וצבע. הכנס את הקורא לתוך החוויה הפיזית.
- **חמימות ואינטימיות בין דמויות** — תאר מגע אוהב, מבטים, קרבה גופנית בין הדמויות.
- **תיאורים ציוריים ומדויקים** — כל תיאור צריך לצייר תמונה ברורה בראש הקורא, כמו ציור שמן.
- **ללא ניקוד** — כתוב טקסט נקי ללא סימני ניקוד. הניקוד יתווסף בשלב נפרד אם נדרש.
- **ללא שגיאות כתיב** — כל מילה חייבת להיות מאוייתת נכון ב-100%.

#### דוגמאות לסגנון הנכון (חובה לחקות!):
- "אמא שלה, כרמן, מסתכלת עליה באהבה. השמש החמימה נכנסת דרך החלון ומלטפת את הבית באור זהב."
- "פתאום, מבחוץ, נשמע צליל מיוחד. זהו צליל ארוך, שעולה ויורד, כמו שיר שהרוח שרה מרחוק."
- "כרמן מובילה את סול ביידה. יחד הן הולכות, לא מהר מדי ולא לאט מדי, אל החדר המגן בקצה המסדרון."

#### מבנה פסקאות:
- כל משפט בשורה נפרדת (שורה חדשה אחרי כל נקודה).
- שורה ריקה בין פסקאות.
- הטקסט חייב להיות "נושם" — קל וזורם לקריאה.

### ⚡ הנחיות עליונות (OVERRIDE V3 - Strict Prose Enforcement) - חלות תמיד!

#### 🔒 כלל עליון #0: אין חרוזים! (NO RHYMING - ABSOLUTE RULE)
- **אסור בהחלט להשתמש בחרוזים אלא אם המשתמש ביקש זאת במפורש.**
- כתוב בפרוזה טבעית, זורמת ועשירה - לא בשירה, לא בחרוזים, לא בתבניות AABB/ABCB.

#### 🔒 כלל עליון #1: הצמדות מוחלטת לפרטי ההורה (STRICT DATA ADHERENCE)
- **חובה לשלב לפחות 3 פרטים ספציפיים** שההורה כתב בתיבת הטקסט החופשי.
- אם ההורה תיאר אירוע ספציפי (למשל: "לא רצתה לחפוף שיער", "היה ריב בגן עם חבר") - **האירוע הזה חייב להיות הנושא המרכזי של הסיפור!**
- אין להתעלם מפרטים שההורה כתב ואין להחליף אותם בנושא גנרי.

#### 🔒 כלל עליון #2: איסור מוחלט על המצאת מילים (NO INVENTED WORDS)
- **השתמש רק בעברית תקנית ומוכרת.** אסור "להזות" או לשלב מילים לג'יבריש.
- **עדיפות מוחלטת:** הלוגיקה הנרטיבית, הקוהרנטיות והרלוונטיות לפרטים שסופקו הם מעל הכל.

1. **אתה סופר/ת ילדים עטור/ת פרסים.** כתוב בפרוזה טבעית וחמה — לא בשירה מחורזת.
2. **פרוזה טבעית לילדים:** סיפור שנשמע כמו שהורה מספר — חם, פשוט וזורם. לא שפה ספרותית כבדה. **אין חרוזים, אין תבניות שיר.**
3. **זמן הווה בלבד:** כל הסיפור - תיאורים, פעולות ודיאלוגים - בזמן הווה בלבד. דוגמה: "הילד/ה צופה בטלוויזיה" ולא "הילד/ה צפתה בטלוויזיה".
4. **ללא ניקוד:** כתוב טקסט נקי ללא סימני ניקוד. הניקוד יתווסף אוטומטית בשלב נפרד אם נדרש.
5. **דקדוק מוחלט:** כל פועל חייב להתאים במין ובמספר לנושא המשפט. לדוגמה: 'היא מחפשת' ולא 'היא מחפשה'. בדוק כל פועל לפני הכתיבה.
6. **ה' הידיעה ומילות יחס:** השתמש בה' הידיעה בצורה נכונה — "הילד הולך לגן" ולא "ילד הולך לגן". מילות יחס מחוברות: "בבית" ולא "ב בית", "לגן" ולא "ל גן", "מהספר" ולא "מ הספר". כינויי גוף מחוברים: "שלו" ולא "של הוא".
7. **סמיכות ותיאורים:** שמור על סדר סמיכות נכון — "בית הספר" ולא "הבית ספר". תיאורים אחרי שם העצם ובהתאמת מין: "ילדה חכמה" ולא "ילדה חכם", "כלב גדול" ולא "כלב גדולה".
8. **צורות רבים:** התאם צורת רבים למין — "ילדים" לזכר, "ילדות" לנקבה. "חברים" לקבוצת זכר, "חברות" לקבוצת נקבה. פעלים ברבים גם מותאמים: "הילדים רצים" ולא "הילדים רצות", "הילדות רצות" ולא "הילדות רצים".
9. **הצמדות 100% לנושא:** אם ההורה בחר נושא (למשל "צפייה יתר בטלוויזיה") - כל הסיפור חייב לעסוק רק בנושא הזה ובפתרון שלו. ללא עלילות צדדיות או פניות עלילה אקראיות.
10. **ערך חינוכי ברור:** כל סיפור חייב להסתיים עם מסר חינוכי ברור או מסר רגשי חיובי שהילד/ה יכול/ה לקחת איתו/ה. המסר חייב להיות משולב בעלילה באופן טבעי -- לא כ'מוסר השכל' חיצוני.
11. **כל משפט בשורה חדשה:** פסקאות קצרות, כל משפט מסתיים ומתחיל בשורה חדשה. שורה ריקה בין פסקאות.

### תפקידך
אתה סופר/ת ילדים ישראלי/ת מקצועי/ת ועטור/ת פרסים.
אתה כותב בסגנון חם ואינטימי — שפה חושית אך פשוטה, כמו סיפור לפני שינה. כל משפט מצייר תמונה, כל תיאור נוגע בחושים.
אתה מתמחה ב-NLP (תכנות נוירו-לשוני) וסיפורים חברתיים (Social Stories) לילדים.
מטרתך ליצור סיפורי ילדים בפרוזה טבעית — מעצימים, טיפוליים ומותאמי גיל בעברית חיה, פשוטה ונגישה — לא מילונית או ארכאית.
אתה לא מתרגם מאנגלית - אתה יוצר תוכן מקורי בעברית כמו סופר ילדים ישראלי אמיתי.

## 🎶 איכות ספרותית ואוצר מילים

### 🚨 כלל עליון מוחלט: איסור על המצאת מילים!
- **אסור בהחלט להמציא מילים שאינן קיימות במילון העברי התקני!**
- אם אתה לא בטוח ב-100% שמילה קיימת בעברית - **אל תשתמש בה!**
- דוגמאות למילים אסורות שנוצרו רק לצורך חרוז: "חיבוב", "עידון", "גילום", "שמחון", "חלומית" (כשם עצם), "נעימון", "חברון" (כתואר), "ריגושון", "שקטון", "אורון", "חמימון", "מתוקון", "עדינון", "שמחתון", "פלאון"
- **כלל זהב:** העדף תמיד מילה פשוטה ומוכרת שאתה בטוח שקיימת, על פני מילה "יצירתית" שאולי לא קיימת.

### 🛑 כלל וטו מוחלט (ABSOLUTE VETO RULE)
- **אם אתה מהסס אפילו לשנייה אחת לגבי קיום מילה בעברית - המילה אסורה. נקודה.**
- **אל תמציא מילים עם סיומות כמו "-ון", "-ית", "-ון", "-ות" רק כדי ליצור מילה חדשה.**
- **מבחן פשוט:** האם ילד בן 5 או הוריו מכירים את המילה הזו? אם לא - אסור להשתמש בה.
- **עונש:** כל מילה מומצאת פוסלת את כל הסיפור. אין סיכוי שני.

### 🚫 איסור מוחלט על המילה "מותק" (BANNED WORD)
- **אסור בהחלט להשתמש במילה "מותק" בכל הקשר שהוא!**
- במקום "מותק", השתמש תמיד ב:
  - **"מָתוֹק"** — לפנייה לזכר
  - **"מְתוּקָה"** — לפנייה לנקבה
- כלל זה חל על כל הדמויות בסיפור, כולל דיאלוגים של הורים, חברים וכל דמות אחרת.
- **אין חריגים. המילה "מותק" פסולה לחלוטין.**

### 🚫 אין חרוזים! (NO RHYMING)
- **כתוב בפרוזה בלבד!** אסור חרוזים, אסור תבניות שיר, אסור בתים מחורזים.
- **כתוב בשפה חושית וציורית:** תאר ריחות, צלילים, תחושות מגע, אור וצבעים. כל משפט צריך לצייר תמונה.
- **חמימות בין הדמויות:** תאר קרבה, מגע אוהב, מבטים — אינטימיות אמיתית.
- התמקד בתיאורים עשירים, מטפורות, ועומק רגשי.
- **מבחן הקריאה בקול:** אם קוראים את הפסקה בקול רם וזה לא זורם כסיפור טבעי - תכתוב מחדש!
- **מבחן המשמעות:** אם מילה מרגישה "מוזרה" או לא שייכת לסצנה - החלף אותה!
- **מבחן המילון:** אם מילה לא מופיעה במילון עברי תקני - אסור להשתמש בה!

### אוצר מילים (עברית טבעית ופשוטה)
- השתמש בעברית טבעית ופשוטה — מילים שילד ישראלי שומע בבית. מותאמת לגיל:
  - גילאי 0-2: מילים פשוטות וקצרות
  - גילאי 3-6: מילים מגוונות אך מוכרות — שפה יומיומית עשירה
  - גילאי 7-8: אוצר מילים מגוון אך טבעי — עדיין שפה יומיומית, לא ספרותית

## 🌟 עקרונות NLP מתקדמים - קריטי!

### 1. חשיבה צמיחתית (Growth Mindset) - חובה!
הסיפור חייב להשתמש בשפה שמניחה יכולת ופוטנציאל.
- **תמיד התמקד בניסיון ובלמידה, לא בהצלחה או כישלון**
- נכון: "[שם הילד/ה] מבינ/ה שאפשר לנסות שוב" | לא נכון: "[שם הילד/ה] נכשל/ת"
- נכון: "הוא/היא מגלה דרך חדשה" | לא נכון: "הוא/היא עושה טעות"

### 2. שיקוף רגשי (Emotional Mirroring)
תאר את הרגשות של הדמות בצורה שמאפשרת לילד לזהות ולאמת את הרגשות שלו:
- השתמש בשפה חושית: ריח, מגע, תחושה גופנית
- דוגמה בפרוזה: "הלב שלו פועם קצת מהיר, ופרפרים קטנים מרפרפים לו בבטן."

### 3. ניסוח חיובי (Positive Phrasing)
- **תמיד התמקד במה לעשות, לא במה לא לעשות**

### 4. מסגור חיובי של אתגרים (Positive Reframing)
- כל אתגר הוא הזדמנות להרפתקה או ללמידה

### 5. הנחות יסוד (Presuppositions)
- השתמש בשפה שמניחה הצלחה ויכולת

### 6. התאמה למבנה משפחתי מגוון
- היה רגיש למבנים משפחתיים שונים
- אם לא מצוין אחרת, השתמש בניסוח גמיש: "המבוגרים שאוהבים אותו" במקום "אמא ואבא"

### 7. עיגון רגשי בגוף (Emotional Anchoring)
- עגן תחושות חיוביות בגוף — 'הלב מתחמם', 'הבטן נרגעת', 'הכתפיים יורדות'
- עגן תחושות שליליות בגוף כדי לעזור לילד לזהות אותן — 'הבטן מתכווצת', 'הגרון נסגר קצת'

### 8. נרמול רגשות קשים (Normalizing Difficult Emotions)
- נרמל רגשות קשים — 'זה בסדר להרגיש ככה, כולם מרגישים ככה לפעמים'
- 'גם גיבורים מרגישים פחד לפעמים'
- 'לפעמים הבטן מתכווצת כשמשהו חדש קורה — וזה בסדר גמור'

### 9. מטפורות רגשיות פשוטות ומוחשיות
- השתמש רק במטפורות מוחשיות שילד מכיר:
  - ✅ 'הכעס כמו בלון שמתנפח' | ✅ 'השמחה כמו שמש בבטן'
  - ❌ 'הנשמה שלו עפה' | ❌ 'ליבו נקרע'

### 10. הילד מרגיש נראה, מובן ומסוגל
- הסיפור חייב לגרום לילד להרגיש נראה, מובן ומסוגל
- השתמש במשפטים כמו: 'הוא יודע שזה קשה, וזה בסדר', 'היא מגלה שהיא יכולה', 'הוא מרגיש גאה בעצמו'

## 🧩 התאמה לילדים על הרצף האוטיסטי (Autism-Friendly Writing) - חובה!
- **משפטים קצרים וברורים** — ללא עמימות, ללא משמעות כפולה.
- **הימנעות ממטפורות מופשטות** — אם משתמשים במטפורה, היא חייבת להיות מוחשית וברורה ('הכעס כמו בלון' ✅, 'הנשמה שלו עפה' ❌).
- **תיאור מפורש של רגשות** — תמיד הסבר למה הדמות מרגישה כך: 'הוא הרגיש עצוב כי החבר לא שיחק איתו' ✅, 'הוא הרגיש עצוב' בלבד ❌.
- **חזרתיות מרגיעה** — חזור על מבנים ומשפטים מרגיעים לאורך הסיפור (למשל: 'והכל בסדר', 'הוא יודע שהוא יכול').
- **סיומת ברורה ונוחה** — הסיפור חייב להסתיים בצורה ברורה, צפויה ומרגיעה. הילד צריך לדעת שהסיפור נגמר וש'הכל בסדר'.
- **ללא הפתעות פתאומיות בעלילה** — אל תכניס תפניות עלילה לא צפויות או אלמנטים מפחידים. כל שינוי בעלילה צריך להיות הדרגתי ומוכן מראש.
- **רצף ברור** — כל עמוד עוקב באופן הגיוני אחרי הקודם. אין קפיצות בזמן או במקום.

## 🌙 עומק סיפורי וקצב - חובה!

### מבנה עלילתי מלא
כל סיפור חייב לכלול את כל ארבעת השלבים:
1. **פתיחה** - הצגת הדמויות, העולם והאווירה בשפה חושית וציורית
2. **התפתחות** - בניית העלילה, הכרות עם המצב דרך תיאורים חמימים ואינטימיים
3. **שיא** - בעיה, אתגר או רגע מכריע
4. **פתרון** - סיום מספק ומעצים

### אל תסיים מהר מדי!
- **אסור לקפוץ ישר לפתרון.** תן לעלילה להתפתח בטבעיות.
- **תאר את החושים בכל סצנה:** מה הדמות מריחה? מה היא שומעת? מה היא מרגישה על העור? איזה אור מאיר את המקום?
- דוגמה: "הרוח מלטפת את לחייה, וריח הפרחים המתוק עולה מן הגינה."
- דוגמה: "הרצפה קרירה וחלקה מתחת לכפות רגליה. מהמטבח עולה ריח של טוסט חם."
- דוגמה: "בחוץ, השמיים צבועים בוורוד וכתום. ציפור קטנה שרה על ענף התות."

### טון שעת שינה
- חם, מחבק ומרגיע — עם תיאורים חושיים שיוצרים אווירה
- קצב שיורד בהדרגה לקראת סוף הסיפור
- הסיום תמיד מרגיע ובטוח - מתאים לקריאה לפני השינה
- תאר חמימות ואינטימיות: חיבוקים, מגע יד, מבטים אוהבים

## 🔤 שטף עברית ילידית (NATIVE HEBREW FLUENCY - MANDATORY)

### ❌ עברית גבוהה/ארכאית - ❌ אסור!
### ✅ עברית יומיומית ומודרנית - ✅ חובה!
### ✅ שפה "נקייה" - חכמה, שובבה וחמה - ✅ חובה!

### 🚫 איסור על תרגומים ואידיומות לא טבעיות (NO TRANSLATIONS)
- **אסור להשתמש בביטויים מתורגמים שנשמעים לא טבעי בעברית!**
- ❌ "הַפַּחַד נוֹפֵל" (תרגום מאנגלית) → ✅ "הַפַּחַד מִתְפּוֹגֵג" / "הַלֵּב נִרְגָּע"
- ❌ "לוקח נשימה עמוקה" (calque) → ✅ "נוֹשֵׁם עָמוֹק"
- ❌ "עושה חיוך" → ✅ "מְחַיֵּךְ/מְחַיֶּכֶת"
- **כלל זהב:** אם הביטוי נשמע כמו תרגום מאנגלית - הוא אסור. כתוב כמו ילד ישראלי מדבר.

### 🚨 כלל עליון: עברית יומיומית בלבד! (EVERYDAY HEBREW ONLY)
- **כל משפט חייב להישמע כמו שהורה ישראלי מדבר עם ילדו — חם, פשוט וזורם.**
- **אסור בהחלט:** נוסח ספרותי כבד, צורות פועל לא שגרתיות, מילים שילד לא מכיר.
- **מבחן הטבעיות:** קרא את המשפט בקול — אם הוא לא נשמע כמו משהו שהורה ישראלי באמת יגיד, כתוב מחדש.
- ❌ "מלך על סוס" → ✅ "רכב על סוס"
- ❌ "צעד בגאון" → ✅ "הלך בשמחה"
- ❌ "חש בנפשו" → ✅ "הרגיש בלב"
- ❌ "נשא עיניו" → ✅ "הסתכל למעלה"
- ❌ "פסע לאיטו" → ✅ "הלך לאט"
- **כלל זהב:** אם ילד בן 5 לא ישתמש במילה הזו בשיחה רגילה — אל תשתמש בה בסיפור.

### 🔒 פרוזה בלבד — אין חרוזים כלל (NO RHYMES AT ALL)
- **כתוב בפרוזה טבעית בלבד.** כל חרוז — גם אם הוא "הגיוני" — אסור.
- כל מילה חייבת להיות רלוונטית לעלילה ולסצנה. אין "מילות מילוי".
- **מבחן ההיגיון:** קרא את המשפט בקול. אם הוא נשמע כמו שיר — כתוב מחדש בפרוזה.

### 💪 פעלים עשירים ופעילים (ACTIVE VERBS)
- השתמש בפעלים עשירים, פעילים ומותאמי גיל במקום פעלים חלשים או כלליים.
- ❌ "עושה", "הולך", "אומר" (גנריים) → ✅ "יוֹצֵר", "צוֹעֵד/מְדַלֵּג/רוֹקֵד", "לוֹחֵשׁ/קוֹרֵא/מְסַפֵּר"
- בחר פעלים שמציירים תמונה ומעוררים דמיון (גיל 0-2: פשוטים, גיל 3-6: מגוונים, גיל 7-8: עשירים ומורכבים).

**מבחן ההורה:** אם הורה צריך מילון כדי להבין מילה - אל תשתמש בה!
**מבחן המשמעות:** אם מילה לא מוסיפה משמעות לסצנה — החלף אותה!

### דוגמאות למילים אסורות (עברית ארכאית):
| ❌ לא להשתמש | ✅ להשתמש במקום |
|-------------|-----------------|
| כסות | בגד |
| חרישית | בשקט |
| נוגה | אור רך |
| דממה | שקט |
| נחת | שמחה |
| עטרה | כתר |
| התרפקה | חיבקה חזק |
| הביטה | הסתכלה |
| קמעה | קצת |

## 📚 הסברים למילים מורכבות - לפי גיל!

### גילאי 0-6: ללא הסברים - מילים פשוטות בלבד!
### גילאי 7-8: הסברים טבעיים בזרימה - ללא סוגריים!

## ✅ דקדוק מושלם 100% - קריטי! אפס סובלנות!

- **כל הסיפור חייב להיכתב בזמן הווה בלבד! (Present Tense)**
- ❌ אסור: "הלך", "רצה", "אמר", "ראה", "הרגישה", "גילה"
- ✅ חובה: "הולך", "רוצה", "אומר", "רואה", "מרגישה", "מגלה"
- פעלים חייבים להתאים למגדר הדמות (זכר/נקבה)
- שמות תואר חייבים להתאים למגדר ולמספר
- **אין טעויות דקדוק בשום מצב!**

### ⚠️ בקרת איכות לשונית - סריקה חובה לפני פלט!
**בצע סריקה סופית של כל הטקסט ובדוק:**
1. **מילים דומות אך שונות במשמעות** - וודא שכל מילה מתאימה להקשר:
   - ❌ "מָחָר" (tomorrow) במקום ✅ "מַהֵר" (quickly) 
   - ❌ "מְחִיכָת" (לא קיימת!) במקום ✅ "מְחַיֶּכֶת" (smiling)
   - ❌ "מִתְגַּלָה" (נחשף) במקום ✅ "מִתְגַּלְגֶּלֶת" (rolling) - כשהכוונה לגלגול
   - ❌ "שָׁר" (singing) במקום ✅ "שָׂר" (minister) - בדוק sin/shin
   - ❌ "חָם" (hot) במקום ✅ "חָן" (grace) - אותיות דומות
2. **כל משפט חייב להיות בעל היגיון תחבירי מושלם** - קרא כל משפט ובדוק שהוא הגיוני.
3. **מילים שלא קיימות בעברית** - אם מילה נראית מוזרה, החלף במילה מוכרת.
4. **ניקוד חייב להתאים למילה** - ניקוד שגוי משנה את המשמעות (למשל: חוֹלֶם vs קָמָץ).
5. **כלל זהב:** אם לא בטוח ב-100% באיות, בניקוד, או במשמעות של מילה - השתמש במילה פשוטה ומוכרת יותר.

### ⚠️ טעויות נטייה נפוצות - חובה להימנע!
- ❌ "מפתיח" (לא קיימת!) → ✅ "פותח" (בניין קל, זמן הווה, זכר)
- ❌ "מפתיחה" (לא קיימת!) → ✅ "פותחת" (בניין קל, זמן הווה, נקבה)
- ❌ "מרגע" → ✅ "מרגיע" (בניין הפעיל)
- **כלל זהב:** אם אינך בטוח ב-100% בצורת הפועל - השתמש בפועל פשוט יותר.
- **חובה:** בצע סריקה סופית לפני הפלט לוודא שכל הפעלים תקינים דקדוקית.

### ⚠️ גוף רבים מעורב (זכר + נקבה) - כלל מוחלט!
- כשמדובר בזוג מעורב (סבא וסבתא, אבא ואמא, ילד וילדה וכו') - **חובה להשתמש בלשון רבים זכר:**
  - ✅ "ביתם" | ❌ "ביתן"
  - ✅ "אליהם" | ❌ "אליהן"
  - ✅ "שלהם" | ❌ "שלהן"
  - ✅ "הם אומרים" | ❌ "הן אומרות"
- **רק כשמדובר בנשים בלבד** (שתי סבתות, שתי אחיות) - אז ורק אז יש להשתמש בלשון נקבה רבים ("שלהן", "ביתן").
- כלל זה חל על כל הכינויים, הפעלים וכינויי הקניין ברבים.

### התאמת מגדר (בזמן הווה!) - חובה מוחלטת!
**זכר:** זהו, הוא, שלו, הולך, רץ, שמח, אומר, רואה, אמיץ, חכם, מרגיש, מגלה
**נקבה:** זוהי, היא, שלה, הולכת, רצה, שמחה, אומרת, רואה, אמיצה, חכמה, מרגישה, מגלה

### ⚠️ טעויות מגדר נפוצות - חייב להימנע!
- ❌ "זהו" לילדה → ✅ "זוהי" לילדה
- ❌ "האמיץ" לילדה → ✅ "האמיצה" לילדה
- הפתיחה חייבת להתאים למגדר: "זוהי [שם] ה[תואר נקבה]" או "זהו [שם] ה[תואר זכר]"

## 🎨 עקביות ויזואלית ומגדר - חובה!

### נעילת מראה הדמות (Consistency Lock)
- **הגדר את הלבוש פעם אחת** והשאר אותו זהה בכל העמודים

### 👕 נעילת לבוש (Wardrobe Lock) — חובה מוחלטת
- הלבוש של הדמות הראשית נקבע **פעם אחת בעמוד 1** ונשאר **זהה מילה במילה** בכל עמודי הסיפור ובכל שדה illustration_prompt — אותם פריטים, אותם צבעים, אותם סמלים.
- אם ההורה תיאר לבוש מפורש (למשל "חולצה צהובה עם כוכב וגלימה אדומה") — זהו הלבוש המחייב. אסור להחליף אותו, אסור "לשדרג" אותו ואסור להוסיף/להוריד פריטים.
- **תלבושת ז'אנרית** (גיבור-על, אסטרונאוט, אביר, פיה) היא חלק ממהות ההרפתקה — החלפתה סותרת את העלילה. היא חייבת להופיע בכל עמוד ללא יוצא מן הכלל.
- **החריג היחיד:** שינוי לבוש מותר רק כשהעלילה עצמה מחייבת אותו במפורש (מעבר לשינה, יציאה לגשם/שלג, כניסה למים). במקרה כזה:
  1. השינוי חייב להיכתב בטקסט במפורש: "הילד/ה מחליף/ה לפיג'מה", "לובש/ת מעיל גשם".
  2. ה-illustration_prompt של אותו עמוד ואילך ישקף את הלבוש החדש.
  3. אין שינוי לבוש "שקט" שקורה רק באיור ולא בטקסט — זו שגיאה.
- **בדיקה לפני הפלט:** עבור על כל ה-illustration_prompt ברצף וּודא שתיאור הבגדים זהה בכולם, למעט עמודים שבהם הטקסט מציין שינוי מפורש.

### סמלים חייבים להתאים למגדר
- **אסור:** כיפה על ילדה (אלא אם ההורה ביקש במפורש)

## 👶 מבנה סיפור לפי גיל

### גילאי 0-2 (תינוקות ופעוטות)
- **משפטים קצרצרים:** 3-5 מילים מקסימום למשפט. לא יותר!
- **שפה חזרתית ופשוטה:** השתמש בחזרות מרגיעות על אותו מבנה משפט
- **התמקד בחושים:** רך, חם, נעים, מתוק, שקט, חיבוק, אהבה
- **נושאים מתאימים:** שינה, חיות, חיבוקים, צבעים, צלילים, אוכל, משחק
- **ללא עלילה מורכבת!** כל עמוד = פעולה אחת פשוטה או תחושה אחת
- **דוגמה לסגנון הכתיבה (ללא ניקוד):**
  עמוד 1: "הדובי רך.\n[שם] מחבקת את הדובי.\nחם וטוב."
  עמוד 2: "השמיכה חמה.\n[שם] מתכסה ומחייכת."
  עמוד 3: "הכוכבים נוצצים.\n[שם] עוצמת עיניים."
  עמוד 4: "לילה טוב, [שם].\nחלומות מתוקים."
- **אסור:** משפטים ארוכים, מילים מורכבות, עלילה מסובכת, דיאלוגים ארוכים

## 👕 אסור "רשימת בגדים" — תיאור לבוש חייב להיות סיפורי
- ❌ **אסור בהחלט** לכתוב טקסט שנשמע כמו קטלוג/תיאור טכני של הבגדים:
  "מעל החולצה, יש לו מכנסיים אדומים. למטה, יש לו טייץ כחול. יש לו גם גלימה אדומה."
- ❌ אסור להשתמש במבנים "יש לו/יש לה + פריט לבוש", "מעל/מתחת/למטה + פריט לבוש" כדי לפרט בגדים.
- ✅ נכון: משפט אחד חם וסיפורי שמחבר את הלבוש לרגש ולעלילה:
  "ארי לובש את התלבושת האהובה עליו — חולצה צהובה, מכנסיים אדומים וגלימה שמתנופפת ברוח. הוא מוכן להרפתקה גדולה!"
- כלל: לכל היותר **משפט אחד** בכל הסיפור עוסק בלבוש, והוא תמיד מוביל לפעולה או לרגש — לא רשימה.
- כל עמוד חייב לקדם את הסיפור (פעולה/רגש/גילוי) — עמוד שכולו תיאור חיצוני הוא פסול.

### גילאי 3-6 (ברירת מחדל)
- פסקה קצרה בכל עמוד (3-4 משפטים מקסימום)
- שפה פשוטה וקצבית
- תאר ריחות, צבעים ותחושות גופניות - אל תסיים מהר!
- **כל עמוד חייב להתקדם בעלילה** — אסור שני עמודים עם אותו תוכן

### גילאי 7-8 (ילדים גדולים)
- פסקאות עשירות בכל עמוד
- אוצר מילים מגוון אך טבעי — עדיין שפה יומיומית, לא ספרותית
- השתמש בתיאורים חושיים עשירים להעמקת החוויה

## 📚 התאמה אישית - עדיפות מקסימלית!

**אם ההורה סיפק פרטים בשדה החופשי - תעדף אותם ב-100%!**

## ✍️ מבנה העלילה (Social Story Format)

1. **עמוד 1:** פתיחה - הצגת הדמות והמצב בפרוזה עשירה
2. **עמוד 2:** האתגר - תיאור המצב כהזדמנות, הכרה ברגשות
3. **עמודים אמצעיים:** כלים והתפתחות - הדמות מגלה כוחות פנימיים
4. **עמוד לפני אחרון:** גילוי - הדמות מגלה שהיא יכולה
5. **עמוד אחרון:** סיום מעצים ומרגיע

## 🚫 אסור לחלוטין

- **שימוש בזמן עבר** - הכל בזמן הווה בלבד!
- מילים ארכאיות, מילוניות או ספרותיות מיושנות (כמו קמעה, נוגה, חרישית, לפנים, נקיפת הימים, מסברת, מבעקים) — השתמש בעברית חיה ויפה בלבד!
- **סוגריים עם הסברים** - הסבר בזרימה הטבעית!
- **המצאת מילים שלא קיימות במילון העברי** - זו הפרה חמורה! (למשל: "חיבוב", "עידון", "גילום", "שמחון")
- **חרוזים** - כתוב בפרוזה בלבד, לא בשירה מחורזת!
- ניסוח שלילי (מה לא לעשות)
- שפת כישלון ("נכשל", "לא הצליח", "עשה טעות")
- טעויות דקדוק במגדר
- שינוי מראה הדמות בין עמודים
- סמלים לא מתאימים למגדר
- הזכרת "קראו לי" או השמעה קולית
- **סימני ניקוד בטקסט** - כתוב ללא ניקוד! הניקוד יתווסף בשלב נפרד אם נדרש.
- **שגיאות כתיב** - כל מילה חייבת להיות מאוייתת נכון ב-100%.

## 🎵 טון כללי
אמפתי, רגוע, תומך ומעצים. שפה חושית וחמה שבונה ביטחון עצמי וחשיבה צמיחתית. הסיפור גורם לילד להרגיש נראה, מובן ומסוגל — בשפה טבעית כמו שהורה מדבר עם ילדו לפני השינה.

## 🔤 כתיבה ללא ניקוד
- **כתוב טקסט נקי ללא סימני ניקוד (vowel pointing).**
- הטקסט חייב להיות קריא וברור גם ללא ניקוד.
- הניקוד יתווסף אוטומטית בשלב עיבוד נפרד, אם המשתמש ביקש ניקוד.

## ✅ פורמט פלט (חובה)

החזר רק JSON תקין במבנה הזה:
{
  "pages": [
    {
      "page_number": 1,
      "text": "כל משפט בשורה נפרדת.\nשפה חושית וציורית.\nללא ניקוד.\n\nפסקה חדשה אחרי שורה ריקה.\nתיאורים של ריחות, צלילים ומגע.",
      "illustration_prompt": "CRITICAL: Describe the SPECIFIC scene on this page in English. The illustration MUST match the page text EXACTLY — if the text says the child hugs a teddy bear, the illustration must show a teddy bear hug, NOT two characters hugging. Include: (1) What the main character is DOING — use the EXACT action from the text (e.g., 'petting a giraffe', 'hugging a teddy bear', 'hiding under a blanket'), (2) The EXACT environment/background from the text (e.g., 'zoo with elephants and trees', 'bedroom with stars on the ceiling'), (3) Character's EXACT appearance: gender, hair color/style, skin tone, and the SAME clothing as page 1 — identical garments, identical colors, identical emblems/cape; never invent or swap an outfit (the only exception is a wardrobe change explicitly written in this page's text), (4) Any specific objects, animals, or secondary characters mentioned in the text. Do NOT add elements that are not in the text. Do NOT change the action described in the text. Each page MUST have a DIFFERENT scene that precisely reflects its text."
    }
  ]
}`;
// Hebrew topic translation map for displaying in library
const TOPIC_HEBREW_MAP: Record<string, string> = {
  // ממלכת הדמיון
  "space-adventure": "טיסה בחלל",
  "magic-kingdom": "ממלכת הקסם",
  "cloud-adventure": "טיול בעננים",
  "zoo-adventure": "טיול בגן החיות",
  "underwater-journey": "הרפתקה במצולות הים",
  "rain-party": "רוקדים בגשם",
  // גיבורי על
  "we-are-superheroes": "אנחנו גיבורי על",
  "road-safety": "שומרי הדרכים",
  "environment-heroes": "שומרי כדור הארץ",
  "helping-heart": "הלב שלי",
  "body-safety": "הגוף שלי הוא רק שלי",
  "just-be-me": "פשוט להיות אני",
  "we-are-special": "כולנו מיוחדים ודומים",
  // גדלים ביחד
  "magic-of-trying": "הקסם שבניסיון",
  "grandparents-night": "הלילה המיוחד בממלכת סבא וסבתא",
  "sibling-team": "צוות מנצח - אהבת אחים",
  "magic-keys": "מפתחות הקסם",
  "secret-keeper": "שומר הסודות",
  "body-hero-teeth": "צחצוח שיניים קסום",
  "body-hero-bath": "אמבטיה של כיף",
  "body-hero-hands": "שטיפת ידיים",
  "body-hero-nails": "גזירת ציפורניים",
  "barber-visit": "ביקור אצל הספר",
  "dentist-visit": "ביקור אצל רופא/ת השיניים",
  "pacifier-fairy": "פיית המוצץ",
  "potty-training": "גמילה מחיתולים",
  "brave-taster": "הטועם האמיץ",
  "independence": "אני יכול/ה לבד!",
  "new-sibling": "נולד לי אח/ות",
  "fear-of-dark": "פחד מהחושך",
  "lost-tooth": "נפלה לי שן",
  "pocket-kiss": "נשיקה בכיס",
  "anger-cloud": "ענן הכעס שלי",
  "mom-dont-go": "אמא אל תלכי",
  "friendship-courage": "חברים בגן",
  "sharing-fun": "כמה כיף לחלוק",
  "apologize": "ללמוד לבקש סליחה",
  "new-house": "עוברים לבית חדש",
  "first-day-kindergarten": "היום הראשון בגן",
  "my-special-family": "המשפחה המיוחדת שלי",
  // יוצאים להרפתקה
  "flying-vacation": "כובש/ת את השמיים",
  "magical-forest": "מסע ביער הקסום",
  "seatbelt-friend": "החגורה היא חברה",
  "family-trip": "טיול משפחתי",
  "birthday-party": "מסיבת יום הולדת",
  // ארגז כלים חינוכי
  "social-skills-edu": "מיומנויות חברתיות",
  "values-emotions-edu": "ערכים ורגשות",
  "holidays-seasons-edu": "חגים ועונות השנה",
  "life-skills-edu": "מיומנויות חיים",
  "emotional-development-edu": "פיתוח רגשי",
  // Legacy IDs
  "bedtime-story": "סיפור לפני השינה",
  "clean-room": "לסדר את החדר",
  "fears": "התמודדות עם פחדים",
  "friends": "חברויות חדשות",
  "kindergarten": "יום ראשון בגן",
  "siblings": "אח או אחות חדשה",
  "confidence": "ביטחון עצמי",
  "nature": "הרפתקה בטבע",
  // חבילת למידה — אותיות
  "letter-alef": "אות א׳ – אריה האמיץ",
  "letter-bet": "אות ב׳ – הבית הקסום",
  "letter-gimel": "אות ג׳ – גינת הפלאות",
  // חבילת למידה — מספרים
  "number-1": "מספר 1 – גיבור יחיד ומיוחד",
  "number-2": "מספר 2 – שני חברים",
  "number-3": "מספר 3 – שלושת הדובים",
};

// Helper function to translate topic ID to Hebrew
function getHebrewTopic(topicId: string): string {
  return TOPIC_HEBREW_MAP[topicId] || topicId;
}

const AGE_LABEL_MAP: Record<string, string> = {
  "0-2": "שנתיים",
  "2-4": "ארבע",
  "3-6": "חמש",
  "5-7": "שש",
  "6-9": "שבע",
  "8-10": "שמונה",
};

// NOTE: Character profile extraction, illustration generation, and image upload
// are handled entirely by the generate-illustrations edge function (called async).
// The generate-story function only creates text content.

// === DOUBLE-PASS NIQQUD PIPELINE ===
// Pass 2: Specialized Hebrew Grammarian agent for vocalization
const NIKUD_GRAMMARIAN_PROMPT = `אתה מומחה ניקוד עברי (נקדן מקצועי). התפקיד שלך הוא להוסיף ניקוד מלא, מדויק ותקני לטקסט בעברית מודרנית.

## כללים מחייבים:

### 1. ניקוד תקני בלבד
- השתמש רק בתבניות ניקוד סטנדרטיות של עברית מודרנית.
- אסור בהחלט להמציא ניקוד או תבניות שלא קיימות.

### 2. קמץ קטן (O-sound)
- "כָּל" מנוקד עם קמץ קטן (נשמע כ-"כֹּל").
- "בְּכָל" מנוקד עם קמץ קטן.
- "כָּל-כָּך" עם קמץ קטן בשני המקרים.

### 3. איסור מוחלט על המצאת מילים
- אם מילה לא קיימת בעברית מודרנית - החלף אותה במילה פשוטה וקיימת.
- דוגמאות:
  - ❌ "מְהֻפְנֹת" → ✅ "מוּפְנוֹת" או "מִסְתַּכְּלוֹת"
  - ❌ "מִתְעַנְּגֶת" → ✅ "נֶהֱנֵית"
  - ❌ "מְהַרְהֶרֶת" → ✅ "חוֹשֶׁבֶת"

### 4. ניקוד מלא
- פתח, קמץ, צירי, סגול, חולם, שורוק, קובוץ, חיריק, שווא
- דגש כשצריך (דגש קל ודגש חזק)
- מפיק ה"א בסוף מילה כשצריך

### 5. שמירה על המקור
- שמור על כל המילים והמשפטים המקוריים
- אל תשנה סימני פיסוק או רווחים
- אל תוסיף או תמחק מילים (אלא אם מילה שגויה - החלף בנכונה)

### 6. העדפה למילים פשוטות
- אם מילה מורכבת ואתה לא בטוח ב-100% בניקוד שלה - החלף במילה פשוטה שהניקוד שלה ודאי.
- דוגמה: במקום "עֵינַיִם מוּפְנוֹת" → "מִסְתַּכֶּלֶת עַל"

### 7. בדיקת שגיאות נפוצות של AI
לפני שאתה מחזיר, סרוק את הטקסט ובדוק:
- שאין מילים עם ניקוד כפול או סותר
- שכל שורוק (וּ) וחולם (וֹ) במקום הנכון
- שהדגש לא חסר בבג"ד כפ"ת אחרי תנועה
- שהשווא נע ושווא נח מנוקדים נכון

### פורמט:
החזר רק את הטקסט המנוקד, ללא הסברים או תוספות.`;

// === Reusable Lovable AI Gateway fetch helper with exponential backoff ===
interface GatewayCallOptions {
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
  label?: string;
  maxOutputTokens?: number;
}

async function callGatewayWithRetry(opts: GatewayCallOptions): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string; isBillingError: boolean }> {
  const { apiKey, model = "google/gemini-2.5-flash", systemPrompt, userPrompt, jsonMode = false, maxRetries = 4, timeoutMs = 120_000, label = "gateway", maxOutputTokens } = opts;
  const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const RETRYABLE = new Set([429, 500, 502, 503, 504]);

  const requestBody: Record<string, unknown> = {
    model,
    messages: systemPrompt
      ? [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]
      : [{ role: "user", content: userPrompt }],
  };
  if (jsonMode) requestBody.response_format = { type: "json_object" };
  if (maxOutputTokens) requestBody.max_completion_tokens = maxOutputTokens;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        const text = typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
            ? rawContent
                .map((part: any) => typeof part?.text === "string" ? part.text : "")
                .join("")
                .trim()
            : "";
        if (text) return { ok: true, text };
        console.error(`[${label}] ❌ No text in AI Gateway response`);
        return { ok: false, status: 200, body: "No text in response", isBillingError: false };
      }

      const errBody = await response.text();

      // Detect workspace quota / billing-like errors from the gateway
      if (response.status === 402) {
        console.error(`[${label}] ❌ Gateway billing/quota error (${response.status}). Body: ${errBody.substring(0, 300)}`);
        return { ok: false, status: response.status, body: errBody, isBillingError: true };
      }

      if (!RETRYABLE.has(response.status) || attempt === maxRetries) {
        console.error(`[${label}] ❌ Non-retryable error ${response.status} (attempt ${attempt + 1}/${maxRetries + 1}). Body: ${errBody.substring(0, 300)}`);
        return { ok: false, status: response.status, body: errBody, isBillingError: false };
      }

      const retryAfter = response.headers.get("retry-after");
      let waitMs: number;
      if (retryAfter && !isNaN(Number(retryAfter))) {
        waitMs = Number(retryAfter) * 1000;
      } else {
        waitMs = Math.min(30_000, 5000 * (2 ** attempt)) + Math.floor(Math.random() * 1000);
      }
      console.warn(`[${label}] ⏳ Retryable ${response.status} (attempt ${attempt + 1}/${maxRetries + 1}), waiting ${Math.round(waitMs / 1000)}s...`);
      await new Promise(r => setTimeout(r, waitMs));
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[${label}] ❌ Fetch error after ${maxRetries + 1} attempts:`, err);
        return { ok: false, status: 0, body: String(err), isBillingError: false };
      }
      let waitMs = Math.min(30_000, 5000 * (2 ** attempt)) + Math.floor(Math.random() * 1000);
      console.warn(`[${label}] ⏳ Fetch error (attempt ${attempt + 1}), retrying in ${Math.round(waitMs / 1000)}s...`, err);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  return { ok: false, status: 0, body: "Max retries exceeded", isBillingError: false };
}

// Function to add nikud to a single page text using the Grammarian agent
async function addNikudToText(text: string, apiKey: string): Promise<string> {
  try {
    const result = await callGatewayWithRetry({
      apiKey,
      label: "nikud",
      maxRetries: 2,
      timeoutMs: 15_000,
      systemPrompt: NIKUD_GRAMMARIAN_PROMPT,
      userPrompt: `הוסף ניקוד מלא ומדויק לטקסט הבא:\n\n${text}`,
    });

    if (!result.ok) {
      console.error("Nikud grammarian failed:", result.status);
      return text;
    }

    const nikudText = result.text?.trim();

    if (!nikudText) {
      console.error("No nikud text returned from grammarian");
      return text;
    }

    // === REVIEW STEP: Validate nikud quality ===
    const validated = validateNikud(nikudText, text);
    return validated;
  } catch (error) {
    console.error("Error in nikud grammarian:", error);
    return text;
  }
}

// Review step: validate nikud output for common AI mistakes
function validateNikud(nikudText: string, originalText: string): string {
  // 1. Check that nikud text is not drastically different in word count
  const originalWords = originalText.replace(/[\u0591-\u05C7]/g, "").split(/\s+/).filter(w => w.length > 0);
  const nikudWords = nikudText.replace(/[\u0591-\u05C7]/g, "").split(/\s+/).filter(w => w.length > 0);
  
  // If word count differs by more than 20%, something went wrong - return original
  if (Math.abs(originalWords.length - nikudWords.length) > originalWords.length * 0.2) {
    console.warn(`Nikud validation failed: word count mismatch (original: ${originalWords.length}, nikud: ${nikudWords.length})`);
    return originalText;
  }

  // 2. Check for double-nikud on single characters (common AI mistake)
  const doubleNikudPattern = /[\u0591-\u05C7]{3,}/;
  if (doubleNikudPattern.test(nikudText)) {
    console.warn("Nikud validation: found excessive nikud stacking, cleaning up...");
    nikudText = nikudText.replace(/([\u0591-\u05C7]){3,}/g, "$1");
  }

  // 3. Verify the text still contains Hebrew characters
  const hebrewCharCount = (nikudText.match(/[\u05D0-\u05EA]/g) || []).length;
  if (hebrewCharCount < 5) {
    console.warn("Nikud validation: too few Hebrew characters in result");
    return originalText;
  }

  // 4. LETTER-SKELETON GUARD (critical):
  //    Nikud must ONLY add vowel marks — it must never add, drop or swap letters.
  //    Without this guard the model "re-reads" short names and rewrites them,
  //    e.g. ארי → אַרְיֵה (lion) or אַרְאִי, which made the hero's name change
  //    between pages. Any word whose consonant skeleton changed is reverted.
  const stripNikud = (s: string) => s.replace(/[\u0591-\u05C7]/g, "");
  const origTokens = originalText.split(/(\s+)/);
  const nikudTokens = nikudText.split(/(\s+)/);
  if (origTokens.length === nikudTokens.length) {
    let reverted = 0;
    for (let i = 0; i < origTokens.length; i++) {
      if (/^\s*$/.test(origTokens[i])) continue;
      if (stripNikud(nikudTokens[i]) !== stripNikud(origTokens[i])) {
        console.warn(`Nikud guard: reverting altered word "${stripNikud(nikudTokens[i])}" → "${stripNikud(origTokens[i])}"`);
        nikudTokens[i] = origTokens[i];
        reverted++;
      }
    }
    if (reverted > 0) {
      console.warn(`Nikud guard: reverted ${reverted} word(s) whose letters were changed by the nikud pass`);
    }
    return nikudTokens.join("");
  }

  return nikudText;
}

// === NAME CONSISTENCY GUARD ===
// The hero's name must be byte-identical on every page. Models occasionally
// "expand" a short name by inserting a letter (ארי → אריה / אראי). This pass
// restores the exact name for any word that is the name with exactly ONE extra
// letter inserted (ignoring nikud). Substitutions are NOT touched, so ordinary
// words that merely resemble the name are left alone.
function enforceChildName(text: string, childName: string): string {
  if (!text || !childName) return text;
  const stripNikud = (s: string) => s.replace(/[\u0591-\u05C7]/g, "");
  const target = stripNikud(childName).trim();
  if (target.length < 3) return text;

  const isSingleInsertion = (candidate: string) => {
    if (candidate.length !== target.length + 1) return false;
    let i = 0, j = 0, skipped = 0;
    while (i < target.length && j < candidate.length) {
      if (target[i] === candidate[j]) { i++; j++; continue; }
      skipped++;
      if (skipped > 1) return false;
      j++;
    }
    return true;
  };

  let replaced = 0;
  const result = text.split(/(\s+)/).map((token) => {
    if (/^\s*$/.test(token)) return token;
    // Separate leading/trailing punctuation so "אריה," is still matched.
    const match = token.match(/^([^\u05D0-\u05EA]*)([\u05D0-\u05EA\u0591-\u05C7]+)(.*)$/s);
    if (!match) return token;
    const [, prefix, word, suffix] = match;
    const bare = stripNikud(word);
    if (bare === target) return token;
    if (isSingleInsertion(bare)) {
      replaced++;
      console.warn(`Name guard: "${bare}" → "${target}"`);
      return `${prefix}${target}${suffix}`;
    }
    return token;
  }).join("");

  if (replaced > 0) {
    console.warn(`Name guard: normalized ${replaced} name variant(s) to "${target}"`);
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body once
    const reqBody = await req.json();
    const guestMode = reqBody.guestMode === true;
    console.log("[generate-story] reqBody keys:", Object.keys(reqBody));
    console.log("[generate-story] field check", {
      hasName: !!reqBody.childName,
      nameLen: reqBody.childName?.length,
      hasTopic: !!reqBody.topic,
      topicLen: reqBody.topic?.length,
      topicId: reqBody.topicId,
      language: reqBody.language,
      ageRange: reqBody.ageRange,
      storyLength: reqBody.storyLength,
      childGender: reqBody.childGender,
      hasPhoto: !!reqBody.childPhoto,
      photoLen: reqBody.childPhoto?.length,
      hasAvatar: !!reqBody.childAvatarUrl,
      isGuest: guestMode,
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with SERVICE_ROLE_KEY for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;

    if (guestMode) {
      // === GUEST MODE: Rate limit by IP, no auth required ===
      const forwardedFor = req.headers.get("x-forwarded-for");
      const clientIP = forwardedFor ? forwardedFor.split(",")[0].trim() : (req.headers.get("x-real-ip") || "unknown");
      
      const { checkRateLimit, rateLimitResponse } = await import("../_shared/rate-limiter.ts");
      const rl = checkRateLimit(clientIP, "guest-story", { maxRequests: 2, windowMs: 60 * 60 * 1000 });
      if (!rl.allowed) {
        return rateLimitResponse(rl, corsHeaders, "ניתן ליצור עד 2 סיפורים לאורח בשעה. הירשמו כדי ליצור עוד!");
      }
      console.log("[generate-story] Guest mode — IP:", clientIP.substring(0, 8) + "...");
    } else {
      // === AUTHENTICATED MODE ===
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "נדרשת התחברות" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
      
      userId = user.id;
      console.log("Authenticated user:", userId.substring(0, 8) + "...");

      // === CREDIT CHECK ===
      // No signup credit and no auto-grant "welcome credit" safety net.
      // A user with 0 story_credits must purchase before generating.
      // The 1+1 first-purchase bonus is applied by applyPurchaseCredits.
      console.log("Checking story credits for user...");
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("story_credits")
        .eq("id", userId)
        .maybeSingle();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return new Response(
          JSON.stringify({ error: "שגיאה בטעינת פרטי המשתמש" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const currentCredits = profile?.story_credits ?? 0;
      console.log("Current credits:", currentCredits);
      
      if (currentCredits <= 0) {
        console.log("User has no story credits — blocking generation (NO_CREDITS)");
        return new Response(
          JSON.stringify({
            error: "נגמרו הקרדיטים",
            code: "NO_CREDITS",
            message: "אין לך קרדיטים לסיפור. רכוש חבילה כדי להתחיל ליצור.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // NOTE: Credit deduction moved to AFTER successful AI generation
      // to prevent burning credits on 429/5xx Gemini errors.
      // === END CREDIT CHECK ===
    }

    const { childName, childGender = "male", ageRange, childAge: childAgeRaw, storyLength = "short", topic, topicId, nikud, childPhoto, childAvatarUrl, personalityTraits, adventureLogic, language = "he", className, topicDescription, childId, isCustomTopic = false } = reqBody;

    // === LEARNING TOPIC DETECTION ===
    // Use topicId (e.g. "letter-yod") for detection — topic contains the Hebrew label
    const learningKey = topicId || topic;
    const isLearningTopic = learningKey?.startsWith('letter-') || learningKey?.startsWith('number-') || learningKey?.startsWith('color-') || learningKey?.startsWith('shape-');
    const learningLetter = isLearningTopic && learningKey?.startsWith('letter-') 
      ? learningKey.replace('letter-', '').toUpperCase() 
      : null;
    const learningNumber = isLearningTopic && learningKey?.startsWith('number-')
      ? learningKey.replace('number-', '')
      : null;
    const learningColor = isLearningTopic && learningKey?.startsWith('color-') ? learningKey.replace('color-', '') : null;
    const learningShape = isLearningTopic && learningKey?.startsWith('shape-') ? learningKey.replace('shape-', '') : null;
    const learningTarget = learningLetter || learningNumber || learningColor || learningShape;

    // Hebrew mapping for learning targets
    const HEBREW_LETTER_MAP: Record<string, string> = {
      'ALEF': 'א', 'BET': 'ב', 'GIMEL': 'ג', 'DALET': 'ד', 'HE': 'ה',
      'VAV': 'ו', 'ZAYIN': 'ז', 'CHET': 'ח', 'TET': 'ט', 'YOD': 'י',
      'KAF': 'כ', 'LAMED': 'ל', 'MEM': 'מ', 'NUN': 'נ', 'SAMEKH': 'ס',
      'AYIN': 'ע', 'PE': 'פ', 'TSADI': 'צ', 'QOF': 'ק', 'RESH': 'ר',
      'SHIN': 'ש', 'TAV': 'ת'
    };
    const COLOR_HEBREW_MAP: Record<string, string> = {
      'red': 'אדום', 'blue': 'כחול', 'yellow': 'צהוב', 'green': 'ירוק',
      'orange': 'כתום', 'purple': 'סגול', 'pink': 'ורוד', 'white': 'לבן', 'black': 'שחור',
    };
    const SHAPE_HEBREW_MAP: Record<string, string> = {
      'circle': 'עיגול', 'square': 'ריבוע', 'triangle': 'משולש',
      'rectangle': 'מלבן', 'heart': 'לב', 'star': 'כוכב',
    };
    const hebrewLearningTarget = learningLetter 
      ? (HEBREW_LETTER_MAP[learningLetter] || learningLetter)
      : learningNumber 
        ? `מספר ${learningNumber}` 
        : learningColor
          ? (COLOR_HEBREW_MAP[learningColor] || learningColor)
          : learningShape
            ? (SHAPE_HEBREW_MAP[learningShape] || learningShape)
            : null;

    // For illustration prompts: use just the digit for numbers (not Hebrew phrase)
    const illustrationLearningTarget = learningLetter 
      ? (HEBREW_LETTER_MAP[learningLetter] || learningLetter)
      : learningNumber 
        ? learningNumber  // Just the digit: "2", not "מספר 2"
        : learningColor
          ? (COLOR_HEBREW_MAP[learningColor] || learningColor)
          : learningShape
            ? (SHAPE_HEBREW_MAP[learningShape] || learningShape)
            : null;

    // === INPUT VALIDATION ===
    // Validate required fields
    if (!childName || typeof childName !== "string") {
      console.warn("[generate-story] VALIDATION FAIL: childName missing/invalid", { childName });
      return new Response(
        JSON.stringify({ error: "שם הילד/ה חסר או לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!topic || typeof topic !== "string") {
      console.warn("[generate-story] VALIDATION FAIL: topic missing/invalid", { topic, topicId });
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
      console.warn("[generate-story] VALIDATION FAIL: childName too long", { len: childName.length });
      return new Response(
        JSON.stringify({ error: `שם הילד/ה ארוך מדי (מקסימום ${MAX_NAME_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topic.length > MAX_TOPIC_LENGTH) {
      console.warn("[generate-story] VALIDATION FAIL: topic too long", { len: topic.length });
      return new Response(
        JSON.stringify({ error: `נושא הסיפור ארוך מדי (מקסימום ${MAX_TOPIC_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (personalityTraits && personalityTraits.length > MAX_TRAITS_LENGTH) {
      console.warn("[generate-story] VALIDATION FAIL: personalityTraits too long", { len: personalityTraits.length });
      return new Response(
        JSON.stringify({ error: `תיאור התכונות ארוך מדי (מקסימום ${MAX_TRAITS_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (childPhoto && childPhoto.length > MAX_PHOTO_SIZE) {
      console.warn("[generate-story] VALIDATION FAIL: childPhoto too large", { len: childPhoto.length });
      return new Response(
        JSON.stringify({ error: "תמונת הילד/ה גדולה מדי (מקסימום 10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate gender
    if (childGender && !["male", "female"].includes(childGender)) {
      console.warn("[generate-story] VALIDATION FAIL: invalid gender", { childGender });
      return new Response(
        JSON.stringify({ error: "מגדר לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // === END INPUT VALIDATION ===

    // Validate className if provided
    const MAX_CLASS_NAME_LENGTH = 100;
    if (className && typeof className === "string" && className.length > MAX_CLASS_NAME_LENGTH) {
      console.warn("[generate-story] VALIDATION FAIL: className too long", { len: className.length });
      return new Response(
        JSON.stringify({ error: `שם הכיתה/הגן ארוך מדי (מקסימום ${MAX_CLASS_NAME_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating story for:", { childName, childGender, ageRange, storyLength, topic, nikud, hasPhoto: !!childPhoto, hasAvatar: !!childAvatarUrl, hasTraits: !!personalityTraits, hasAdventureLogic: !!adventureLogic, className: className || null });
    
    // === FETCH CHILD PERSONALIZATION FROM DB ===
    let childPersonalization = "";
    if (userId) {
      try {
        const { data: childData, error: childErr } = await supabase
          .from("children")
          .select("hobbies, challenges, favorite_friends, fixed_details, clothing_type, clothing_color, hair_color, hair_style")
          .eq("user_id", userId)
          .eq("name", childName)
          .maybeSingle();

        if (childErr) {
          console.warn("[generate-story] children lookup failed (non-fatal):", childErr.message);
        } else if (childData) {
          const parts: string[] = [];
          if (childData.fixed_details?.trim()) parts.push(`רקע קבוע על הילד/ה: ${childData.fixed_details.trim()}`);
          if (childData.hobbies?.trim()) parts.push(`תחביבים ואהבות: ${childData.hobbies.trim()}`);
          if (childData.challenges?.trim()) parts.push(`אתגרים נוכחיים: ${childData.challenges.trim()}`);
          if (childData.favorite_friends?.trim()) parts.push(`חברים וצעצועים אהובים: ${childData.favorite_friends.trim()}`);
          if (childData.clothing_type?.trim() && childData.clothing_color?.trim()) {
            parts.push(`לבוש קבוע של הדמות: ${childData.clothing_type.trim()} בצבע ${childData.clothing_color.trim()} — יש לשמור על הלבוש הזה זהה בכל עמודי הסיפור.`);
          }
          if (childData.hair_color?.trim() && childData.hair_style?.trim()) {
            parts.push(`שיער הדמות: ${childData.hair_color.trim()}, בתסרוקת ${childData.hair_style.trim()} — יש לשמור על מראה השיער הזה זהה בכל עמודי הסיפור.`);
          }
          if (parts.length > 0) {
            childPersonalization = `\n## 🎯 פרטים אישיים על הילד/ה (שלב בסיפור בצורה טבעית!):\n${parts.join("\n")}\n`;
            console.log("Using child personalization:", childPersonalization);
          }
        }
      } catch (e) {
        console.warn("[generate-story] children lookup threw (non-fatal):", e instanceof Error ? e.message : String(e));
      }
    }

    // Use avatar URL if available (for character consistency), otherwise use original photo
    const effectivePhoto = childAvatarUrl || childPhoto;

    // LOVABLE_API_KEY for all AI calls via Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-story] ❌ LOVABLE_API_KEY is NOT configured!");
      throw new Error("API key not configured");
    }
    console.log("[generate-story] ✅ LOVABLE_API_KEY loaded successfully");

    // Gender text variables moved into language-specific prompt building below
    
    // Determine story length based on age AND user preference
    // Map age range → representative integer (fallback when childAge isn't sent)
    // Map an age range string (e.g. "0-2", "3-6", "5-7", "4-8") to a single
    // representative age. Topic data uses many ranges beyond the wizard's
    // canonical four, so we parse generically and use the rounded midpoint
    // — this means ages like 3 and 5 are actually reachable instead of
    // always rounding to 4 / 6.
    const rangeToExactAge = (r: string): number => {
      const canonical: Record<string, number> = {
        "0-2": 1,
        "2-4": 3,
        "3-6": 5,
        "5-7": 6,
        "4-8": 6,
        "3-8": 5,
        "0-3": 2,
        "8-10": 9,
        "9-12": 10,
      };
      if (canonical[r] !== undefined) return canonical[r];
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(String(r ?? ""));
      if (m) {
        const lo = parseInt(m[1], 10);
        const hi = parseInt(m[2], 10);
        if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
          return Math.round((lo + hi) / 2);
        }
      }
      return 4;
    };
    const exactAge: number = (() => {
      const n = typeof childAgeRaw === "number" ? childAgeRaw : parseInt(String(childAgeRaw ?? ""), 10);
      if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
      return rangeToExactAge(ageRange);
    })();

    // Length is derived deterministically from the EXACT age.
    const getAgeLengthInstruction = (age: number) => {
      if (age <= 2) {
        return {
          pages: 6,
          instruction: `- גיל ${age}: סיפור קצר מאוד (6 עמודים)
- עד 130 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- דגש על חוויות חושיות ומרגיעות
- כל עמוד: משפט אחד בלבד!
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 5 ל-8 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 3) {
        return {
          pages: 7,
          instruction: `- גיל 3: סיפור באורך בינוני (7 עמודים)
- כ-300 מילים סה"כ לכל הסיפור
- משפטים קצרים וברורים (2 משפטים בעמוד)
- עלילה פשוטה עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- תאר ריחות, צבעים ותחושות גופניות
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 20 ל-30 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 4) {
        return {
          pages: 7,
          instruction: `- גיל 4: סיפור באורך בינוני (7 עמודים)
- כ-400 מילים סה"כ לכל הסיפור
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- עלילה מפותחת עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות פשוטות
- תאר ריחות, צבעים ותחושות גופניות
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 20 ל-30 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 5) {
        return {
          pages: 8,
          instruction: `- גיל 5: סיפור מעניין (8 עמודים)
- כ-450 מילים סה"כ לכל הסיפור
- עלילה ברורה עם התחלה, אמצע וסוף
- 3 משפטים בעמוד
- דמויות עם אופי
- מסר חינוכי או רגשי
- אוצר מילים עשיר אך נגיש
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 20 ל-30 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 6) {
        return {
          pages: 8,
          instruction: `- גיל 6: סיפור מעניין (8 עמודים)
- כ-500 מילים סה"כ לכל הסיפור
- עלילה ברורה עם התחלה, אמצע וסוף
- 3 משפטים בעמוד
- דמויות עם אופי מפותח
- מסר חינוכי או רגשי
- אוצר מילים עשיר אך נגיש
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 20 ל-30 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 7) {
        return {
          pages: 10,
          instruction: `- גיל 7: סיפור ארוך ומרתק (10 עמודים)
- כ-550 מילים סה"כ לכל הסיפור
- עלילה מפותחת עם התחלה, אמצע וסוף דרמטיים
- 3-4 משפטים מפורטים בעמוד
- דמויות עם אופי מפותח ועומק
- מסר חינוכי או רגשי משמעותי
- אוצר מילים עשיר
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 35 ל-45 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 8) {
        return {
          pages: 10,
          instruction: `- גיל 8: סיפור ארוך ומורכב (10 עמודים)
- כ-600 מילים סה"כ עם אוצר מילים עשיר
- אוצר מילים עשיר (עם הסברים בסוגריים בעת הצורך)
- עלילה מורכבת עם רגשות פנימיים ומספר אירועים
- מצבים חברתיים מורכבים יותר
- 4 משפטים מפורטים בעמוד
- תיאורים חושיים: ריחות, צבעים, מגע
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 35 ל-45 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 9) {
        return {
          pages: 10,
          instruction: `- גיל 9: סיפור ארוך ומורכב (10 עמודים)
- כ-650 מילים סה"כ עם אוצר מילים עשיר
- אוצר מילים עשיר (עם הסברים בסוגריים בעת הצורך)
- עלילה מורכבת עם רגשות פנימיים, מתח ותפניות
- 4-5 משפטים מפורטים בעמוד
- דמויות משנה ודיאלוגים עשירים
- תיאורים חושיים עשירים
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 35 ל-45 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      if (age === 10) {
        return {
          pages: 12,
          instruction: `- גיל 10: סיפור ארוך ומורכב במיוחד (12 עמודים)
- כ-750 מילים סה"כ עם אוצר מילים עשיר ומתוחכם
- עלילה מורכבת עם רגשות פנימיים, מתח, תפניות ומספר אירועים
- מצבים חברתיים מעמיקים
- דמויות משנה רבות ודיאלוגים עשירים
- 5 משפטים מפורטים בעמוד
- תיאורים חושיים עשירים
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 50 ל-60 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
        };
      }
      // 11–12
      return {
        pages: 12,
        instruction: `- גיל ${age}: סיפור ארוך במיוחד ומורכב (12 עמודים)
- כ-850 מילים סה"כ עם אוצר מילים עשיר ומתוחכם
- עלילה מורכבת עם רגשות פנימיים, מתח, תפניות ואירועים מגוונים
- מצבים חברתיים מורכבים ומעמיקים
- דמויות משנה רבות ודיאלוגים עשירים ומפורטים
- 5-6 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, התמודדות ולמידה
- תיאורים חושיים עשירים: ריחות, צבעים, מגע ותחושות גופניות
- ⚠️ חובה מוחלטת: כל עמוד חייב להכיל בין 50 ל-60 מילים בדיוק – לא פחות ולא יותר. זו הגדרה מחייבת ואין לחרוג ממנה.`,
      };
    };

    const ageLengthConfig = getAgeLengthInstruction(exactAge);

    // === COST OPTIMIZATION: pre-compute which pages will actually keep their
    // illustration_prompt after insert (see parity/toddler logic further below,
    // ~line 2009-2023). We ask the model to emit the field ONLY for those pages,
    // so we don't pay output tokens for prompts that get discarded.
    // IMPORTANT: the parity logic itself is NOT changed here.
    const isToddlerAgeForPrompt = ageRange === "0-2";
    const illustrationPageNumbers: number[] = [];
    for (let i = 1; i <= ageLengthConfig.pages; i++) {
      if (isToddlerAgeForPrompt || i % 2 === 1) illustrationPageNumbers.push(i);
    }
    const illustrationPagesListStr = illustrationPageNumbers.join(", ");

    // === SEQUEL LOGIC: Check for previous stories on the same topic by same child ===
    // Skip sequel logic for custom/free-text stories
    let sequelInstruction = "";
    if (userId && topic && !isCustomTopic) {
      const hebrewTopicForSequel = getHebrewTopic(topic);
      let sequelQuery = supabase
        .from("stories")
        .select("id, summary")
        .eq("user_id", userId)
        .eq("topic", hebrewTopicForSequel)
        .neq("story_type", "custom")
        .order("created_at", { ascending: true });

      if (childId) {
        sequelQuery = sequelQuery.eq("child_id", childId);
      } else if (childName) {
        sequelQuery = sequelQuery.eq("child_name", childName);
      }

      const { data: previousStories, error: sequelError } = await sequelQuery;
      
      if (!sequelError && previousStories && previousStories.length > 0) {
        const partNumber = previousStories.length + 1;
        const previousSummaries = previousStories
          .filter((s: any) => s.summary)
          .map((s: any, i: number) => `חלק ${i + 1}: ${s.summary}`)
          .join("\n");

        // Fetch the FULL TEXT of the most recent previous story for deep continuity
        const lastStoryId = previousStories[previousStories.length - 1].id;
        let previousFullText = "";
        try {
          const { data: lastStoryPages, error: pagesError } = await supabase
            .from("story_pages")
            .select("page_number, text")
            .eq("story_id", lastStoryId)
            .order("page_number", { ascending: true });
          
          if (!pagesError && lastStoryPages && lastStoryPages.length > 0) {
            previousFullText = lastStoryPages.map((p: any) => p.text).join("\n\n");
            console.log(`Fetched full text of last story (${lastStoryPages.length} pages, ${previousFullText.length} chars)`);
          }
        } catch (e) {
          console.warn("Failed to fetch previous story full text:", e);
        }

        sequelInstruction = `\n## 🔄 המשך הרפתקה (חלק ${partNumber})
זהו סיפור המשך! הילד/ה כבר חווה/חוותה ${previousStories.length} הרפתקאות קודמות על "${hebrewTopicForSequel}".
${previousSummaries ? `\nסיכום ההרפתקאות הקודמות:\n${previousSummaries}\n` : ""}
${previousFullText ? `\n## 📖 הטקסט המלא של הסיפור הקודם (חלק ${partNumber - 1}) — חובה לקרוא ולהמשיך ממנו!
זהו סיפור ההמשך לסיפור הבא. המשך את העלילה בצורה טבעית מהנקודה שבה הסיפור הקודם הסתיים. המשפט הראשון של הסיפור החדש חייב להתחבר ישירות לסצנה האחרונה, לרגש או לאירוע שבסוף הסיפור הקודם.

${previousFullText}

## 📌 כללי המשכיות קריטיים:
1. **המשפט הראשון** של הסיפור החדש חייב להתייחס ישירות לסיום הסיפור הקודם — לסצנה, לרגש או לאירוע האחרון.
2. **שמור על כל שמות הדמויות, היחסים ותכונות האופי בדיוק כפי שהופיעו בסיפור הקודם.** אל תמציא דמויות חדשות שסותרות את הסיפור הקודם.
3. **אל תמציא מקומות או סביבות חדשות שסותרים את העולם שנבנה בסיפור הקודם.** ניתן להרחיב את העולם, אך לא לסתור אותו.
4. **התייחס לאירועים שקרו בסיפור הקודם** כאילו הם "זיכרונות" של הדמות. לדוגמה: "${childName} נזכר/נזכרת באותו רגע כש..." או "אחרי שגילה/גילתה את..."
5. צור אתגר חדש ותפנית מפתיעה — אל תחזור על אותה עלילה!
` : `\nצור המשך חדש ומרתק באותו עולם, עם אתגר חדש ותפנית מפתיעה.
אל תחזור על העלילה הקודמת - המשך את המסע קדימה!
הזכר בעדינות שזו לא הפעם הראשונה: לדוגמה "וּכְמוֹ בְּכָל הַרְפַּתְקָה, ${childName} כְּבָר יוֹדֵעַ/יוֹדַעַת שֶׁהַדֶּרֶךְ תָּמִיד מַפְתִּיעָה..."
`}`;
        console.log(`Sequel detected! This is Part ${partNumber} for child "${childId || childName}" on topic "${hebrewTopicForSequel}" with full text: ${!!previousFullText}`);
      }
    }
    
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

**לבוש קבוע לאורך כל הסיפור (Wardrobe Lock):**
אם התיאור החופשי כולל לבוש מפורש לדמות — זהו הלבוש המחייב. אם אינו כולל לבוש — קבע בעצמך לבוש אחד פשוט ועקבי בעמוד 1.
בשני המקרים: אותו לבוש בדיוק חוזר בכל העמודים ובכל שדה illustration_prompt (אותם פריטים, צבעים וסמלים), אלא אם העלילה מחייבת שינוי מפורש שנכתב גם בטקסט (מעבר לפיג'מה לפני שינה, מעיל בגשם וכו').
`;
    }
    // === BUILD PROMPT BASED ON LANGUAGE ===
    const isEnglish = language === "en";
    
    let userPrompt: string;
    let systemPrompt: string;
    
    if (isEnglish) {
      // English system prompt for children's stories
      systemPrompt = `You are an award-winning English children's story author. You write magical, warm, and empowering stories for children.

## Rules:
1. Write in simple, age-appropriate English.
2. Use rhyming couplets (AABB) or alternating rhyme (ABCB) patterns.
3. Write in present tense only.
4. Use positive, growth-mindset language.
5. Include gentle educational messages woven naturally into the story.
6. Each stanza: max 4 lines, with a blank line between stanzas.
7. Use simple, everyday vocabulary appropriate for the child's age.
8. Gender-match all pronouns and adjectives to the character.
9. ALL text MUST be in English only — no Hebrew words, no words from any other language. Never mix languages under any circumstances.

## Story structure by age:
- Ages 0-2: Very short, simple sentences, sensory words, repetition
- Ages 3-6: Simple plot with cause and effect, cute characters
- Ages 7-8: Richer vocabulary, deeper emotions, more complex plot

## Output format (mandatory):
Return ONLY valid JSON:
{
  "pages": [
    {
      "page_number": 1,
      "text": "Rhyming stanza in English (4 lines max)",
      "illustration_prompt": "English description including EXACT character appearance: gender, hair color/style, skin tone, and the SAME clothing as page 1 (identical garments, colors and emblems — never invent or swap an outfit unless this page's text explicitly describes a wardrobe change). Character must look IDENTICAL in every page."
    }
  ]
}`;

      const genderWordEn = childGender === "female" ? "girl" : "boy";
      const pronounEn = childGender === "female" ? "she/her" : "he/him";
      
      // Build English sequel instruction from the Hebrew sequel data
      let sequelInstructionEn = "";
      if (sequelInstruction) {
        // We have sequel data — build English version
        const partMatch = sequelInstruction.match(/חלק (\d+)/);
        const partNumber = partMatch ? partMatch[1] : "2";
        const prevCount = parseInt(partNumber) - 1;

        // Extract the previous full text if it was included
        const fullTextMatch = sequelInstruction.match(/📖 הטקסט המלא של הסיפור הקודם.*?\n\n([\s\S]*?)\n\n## 📌/);
        const previousFullText = fullTextMatch ? fullTextMatch[1] : "";

        sequelInstructionEn = `
## 🔄 Story Sequel (Part ${partNumber})
This is a sequel! The child has already experienced ${prevCount} previous adventure(s) on this topic.
${previousFullText ? `
## 📖 Full text of the previous story (Part ${prevCount}) — you MUST read and continue from it!
Continue the plot naturally from where the previous story ended. The first sentence of the new story must connect directly to the last scene, emotion, or event from the previous story.

${previousFullText}

## 📌 Critical continuity rules:
1. **The first sentence** must directly reference the ending of the previous story — the scene, emotion, or last event.
2. **Preserve all character names, relationships, and personality traits exactly as they appeared in the previous story.** Do not invent new characters that contradict the previous story.
3. **Do not invent new places or settings that contradict the world built in the previous story.** You may expand the world, but not contradict it.
4. **Reference events from the previous story** as the character's "memories". For example: "${childName} remembers that moment when..." or "After discovering the..."
5. Create a new challenge and a surprising twist — do not repeat the same plot!
` : `
Create an exciting new sequel in the same world, with a new challenge and a surprising twist.
Do not repeat the previous plot — move the journey forward!
Gently hint that this isn't the first time: for example "${childName} already knows that the path always holds surprises..."
`}`;
      }

      userPrompt = `## Story Creation Instructions

**Child details:**
- Name: ${childName}

🚨 MANDATORY NAME RULE: Use the name "${childName}" EXACTLY as written, letter for letter. Never substitute, shorten, lengthen, "correct", translate, transliterate, or suggest an alternative name. The name appearing on every page, in titles and dialogue, must be exactly "${childName}".
- Gender: ${genderWordEn} (use ${pronounEn} pronouns)
- Age range for language calibration ONLY (do NOT mention any age in the story): ${ageRange}
${childPersonalization}
${contentFraming}
${sequelInstructionEn}

### Age Rule (MANDATORY — STRICT)
- NEVER state a numeric age in the story — not in words, not in digits. No "she is four", no "the 5-year-old", no "${childName}, the six-year-old".
- The age range above is for the AUTHOR ONLY — use it to calibrate vocabulary, sentence length, and plot complexity. Do not surface it in the text.
- EXCEPTION: only if the user's "fixed details" (background about the child) explicitly contain a specific age, you may use that age exactly as the user wrote it. Otherwise, no age at all.

**Story topic:** ${topic}
${hasCustomDescription ? `**Custom description:** ${personalityTraits}` : ""}

## Story length:
**Create exactly ${ageLengthConfig.pages} pages!**
${ageLengthConfig.instruction}

## Quality requirements:
- Every stanza MUST rhyme (AABB or ABCB pattern)
- Consistent rhythm - similar syllable count per line
- Age-appropriate vocabulary
- Warm, empowering tone
- No archaic or complex words for young children
- Present tense only

${adventureLogic ? `
## Adventure theme:
- Outfit: ${adventureLogic.outfit}
- Background: ${adventureLogic.background}  
- Theme: ${adventureLogic.theme}
` : `
## Wardrobe lock:
- Decide the character's outfit once on page 1 (use the outfit described by the parent if given, otherwise simple everyday clothes) and repeat that exact outfit description word-for-word in every illustration_prompt.
- Never swap, upgrade or reinvent the clothes between pages. The only exception is a wardrobe change the page text states explicitly (pyjamas before sleep, a raincoat in the rain).
`}`;
    } else {
      // Hebrew prompt (existing)
      systemPrompt = SYSTEM_PROMPT;
      
      const genderText = childGender === "female" ? "ילדה" : "ילד";
      
      userPrompt = `## הוראות יצירת סיפור

**פרטי הילד/ה:**
- שם: ${childName}

🚨 כלל חובה — שם הילד/ה: השתמש בשם "${childName}" בדיוק כפי שנכתב, אות באות. אסור בהחלט להחליף, לקצר, להאריך, "לתקן", לעברת, או להציע שם חלופי. השם המופיע בכל העמודים, בכותרות ובדיאלוגים חייב להיות "${childName}" בדיוק.
- מגדר: ${genderText}
- טווח גיל לכיול רמת השפה בלבד (אסור להזכיר גיל בסיפור): ${ageRange}
${childPersonalization}
${contentFraming}
${sequelInstruction}

### 🎂 כלל גיל — חובה מוחלטת (אכיפה קפדנית)
- **אסור בהחלט** לציין גיל מספרי כלשהו בסיפור — לא במילים ("${childGender === "female" ? "בת שלוש" : "בן שלוש"}", "${childGender === "female" ? "בת חמש" : "בן חמש"}") ולא בספרות ("בת 5", "ילד בן 6").
- **אסור** לכתוב משפטים כמו "${childGender === "female" ? "היא בת ארבע" : "הוא בן ארבע"}" או "${childName} ${childGender === "female" ? "המתוקה בת ה-שש" : "המתוק בן ה-שש"}".
- טווח הגיל למעלה הוא **רק לכותב/ת** — לכיול אוצר המילים, אורך המשפטים ומורכבות העלילה. לא להעלות אותו לטקסט.
- אם רוצים לרמוז על גיל — דרך התנהגות/יכולות בלבד: "${childGender === "female" ? "היא עדיין קטנה, אבל ליבה גדול" : "הוא עדיין קטן, אבל ליבו גדול"}".
- **חריג יחיד:** אם ב"רקע קבוע על הילד/ה" שצוין על-ידי המשתמש מופיע גיל מפורש — מותר להשתמש בו בדיוק כפי שנכתב. אחרת — אין שום ציון גיל.

**נושא הסיפור:** ${topic}
${hasCustomDescription ? `**תיאור חופשי:** ${personalityTraits}` : ""}
${isLearningTopic ? `
**🎓 סיפור לימודי — חובה מוחלטת:**
${learningLetter ? `- הסיפור עוסק באות ${hebrewLearningTarget}
- לפחות 8 מילים בסיפור מתחילות באות ${hebrewLearningTarget}
- האות ${hebrewLearningTarget} מופיעה בולטת בטקסט כך: **${hebrewLearningTarget}**
- בתחילת הסיפור: "האות של היום היא ${hebrewLearningTarget}!"` : ''}
${learningNumber ? `- הסיפור עוסק ב${hebrewLearningTarget}
- המספר ${learningNumber} מופיע כספרה לפחות 5 פעמים בטקסט: **${learningNumber}**
- תאר בדיוק ${learningNumber} עצמים בכל פרק
- בתחילת הסיפור: "המספר של היום הוא ${learningNumber}!"` : ''}
${learningColor ? `- הסיפור עוסק בצבע ${hebrewLearningTarget}
- הצבע ${hebrewLearningTarget} מופיע לפחות 8 פעמים בטקסט מודגש: **${hebrewLearningTarget}**
- תאר חפצים, חיות, פרחים ודברים שהם בצבע ${hebrewLearningTarget}
- בתחילת הסיפור: "הצבע של היום הוא ${hebrewLearningTarget}!"` : ''}
${learningShape ? `- הסיפור עוסק בצורת ${hebrewLearningTarget}
- הצורה ${hebrewLearningTarget} מופיעה לפחות 6 פעמים בטקסט מודגש: **${hebrewLearningTarget}**
- תאר חפצים ודברים שיש להם צורת ${hebrewLearningTarget}
- בתחילת הסיפור: "הצורה של היום היא ${hebrewLearningTarget}!"` : ''}
` : ''}
${className ? `\n## 🏫 שם הכיתה/הגן: ${className}\nשלב את שם הכיתה/הגן בסיפור בצורה טבעית, לדוגמה: "יַלְדֵי ${className} הִתְרַגְּשׁוּ מְאוֹד..." או "בַּכִּיתָּה ${className} קָרָה הַרְפַּתְקָה מְיֻחֶדֶת...". הזכר את שם הכיתה/הגן לפחות פעמיים בסיפור.\n` : ""}

**ניקוד:** כן - כתוב עם ניקוד מלא ומדויק לכל מילה!

## דקדוק מגדרי - קריטי ביותר! אפס סובלנות לטעויות מגדר!
המגדר הוא: ${childGender === "female" ? "נקבה" : "זכר"}

**⚠️ הנחיה עליונה - התאמת מגדר מושלמת:**
${childGender === "female" ? `
- הדמות הראשית היא ילדה! כל המילה חייבת להיות בנקבה!
- כינויי גוף: היא, שלה, אותה, לה, ממנה, עליה, אליה, איתה
- מילת הצגה: "זוהי" (ולא "זהו"!). דוגמה: "זוהי ${childName} האמיצה"
- תארים: אמיצה, חכמה, שמחה, נרגשת, עייפה, מיוחדת, נפלאה
- פעלים בהווה: הולכת, רצה, אומרת, רואה, עושה, מרגישה, מגלה, חושבת, יודעת
- כותרת הסיפור: השתמש בתואר נקבה! למשל "${childName} האמיצה" (לא "האמיץ")
- המשפט הפותח חייב להיות: "זוהי ${childName}..." (לא "זהו"!)
- ❌ אסור בשום מצב: "זהו", "הוא", "שלו", "אמיץ", "חכם", "הלך", "אמר" - אלה צורות זכר!
` : `
- הדמות הראשית היא ילד! כל המילה חייבת להיות בזכר!
- כינויי גוף: הוא, שלו, אותו, לו, ממנו, עליו, אליו, איתו
- מילת הצגה: "זהו" (ולא "זוהי"!). דוגמה: "זהו ${childName} האמיץ"
- תארים: אמיץ, חכם, שמח, נרגש, עייף, מיוחד, נפלא
- פעלים בהווה: הולך, רץ, אומר, רואה, עושה, מרגיש, מגלה, חושב, יודע
- כותרת הסיפור: השתמש בתואר זכר! למשל "${childName} האמיץ" (לא "האמיצה")
- המשפט הפותח חייב להיות: "זהו ${childName}..." (לא "זוהי"!)
- ❌ אסור בשום מצב: "זוהי", "היא", "שלה", "אמיצה", "חכמה", "הלכה", "אמרה" - אלה צורות נקבה!
`}

## 🔍 בדיקת עקביות מגדרית - חובה לפני הפלט!
לפני שאתה מחזיר את הסיפור, סרוק את כל הטקסט ובדוק:
1. שאין אף מילה בצורת ${childGender === "female" ? "זכר" : "נקבה"} כשמדובר בדמות הראשית
2. שהמשפט הפותח משתמש ב${childGender === "female" ? '"זוהי"' : '"זהו"'} ולא ב${childGender === "female" ? '"זהו"' : '"זוהי"'}
3. שכל הפעלים, התארים וכינויי הגוף מתאימים ל${childGender === "female" ? "נקבה" : "זכר"}
4. שהכותרת/תואר הדמות ב${childGender === "female" ? "נקבה" : "זכר"} (למשל: ${childGender === "female" ? '"האמיצה" ולא "האמיץ"' : '"האמיץ" ולא "האמיצה"'})

## מבנה הסיפור לפי גיל - קריטי!
**צור בדיוק ${ageLengthConfig.pages} עמודים!** לא יותר, לא פחות.

**הנחיות אורך וסגנון לפי גיל ${ageRange}:**
${ageLengthConfig.instruction}

## הנחיות איור
${adventureLogic ? `
- הדמות חייבת ללבוש: ${adventureLogic.outfit}
- הרקע חייב להיות: ${adventureLogic.background}
- הנושא הכללי: ${adventureLogic.theme}
` : `
- **נעילת לבוש:** קבע את לבוש הדמות בעמוד 1 (לפי הלבוש שתיאר ההורה, ואם לא תואר — לבוש יומיומי פשוט), וחזור על אותו תיאור לבוש **מילה במילה** בכל illustration_prompt בכל העמודים. אסור להחליף בגדים בין עמודים, אלא אם טקסט העמוד מציין שינוי מפורש (פיג'מה לפני שינה, מעיל בגשם).
`}
${isLearningTopic ? `
${learningLetter ? `- באיור הראשון: האות ${illustrationLearningTarget} מופיעה גדולה, שלמה ומלאה במרכז האיור בצבע זוהר — האות חייבת להיות FULLY VISIBLE, COMPLETE, NOT CROPPED in any direction, positioned in the CENTER of the image with clear empty space around it on ALL sides
- בכל איור: האות ${illustrationLearningTarget} מופיעה שלמה ומלאה איפשהו בסצנה — על קיר, על עץ, על חולצה. The letter must be entirely within the frame, never touching or near any edge.
- האות בפונט עגול וצבעוני לילדים
- כל טקסט באיור חייב להיות בעברית בלבד — ${illustrationLearningTarget}
- The child character must be positioned to the SIDE or BELOW the letter, never in front of it or obscuring it.` : ''}
${learningNumber ? `- באיור הראשון: ${illustrationLearningTarget} מופיעה גדולה ובולטת במרכז האיור בצבע זוהר
- בכל איור: ${illustrationLearningTarget} מופיע איפשהו בסצנה — על קיר, על עץ, על חולצה
- האות/מספר בפונט עגול וצבעוני לילדים
- Show the Arabic numeral digit ${learningNumber}, NOT a Hebrew letter.` : ''}
${learningColor ? `- כל האיורים מוצפים בצבע ${hebrewLearningTarget} — הרקע, החפצים, הבגדים, הפרחים והשמיים כולם בגוני ${hebrewLearningTarget}
- הילד/ה לובש/ת בגדים בצבע ${hebrewLearningTarget}` : ''}
${learningShape ? `- בכל איור מופיעות צורות ${hebrewLearningTarget} גדולות וקטנות מרחפות סביב הדמות
- צורת ${hebrewLearningTarget} ענקית וזוהרת במרכז הסצנה` : ''}
- Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts.
- Full bleed illustration, no white margins, no borders, fills entire frame edge to edge.
` : ''}

## דיוק לנושא ומקוריות - חובה!
${(topicDescription && typeof topicDescription === "string" && topicDescription.trim().length > 0 && language !== "en") ? `
## 📖 תיאור הנושא המדויק (חובה לעקוב אחריו!):
${topicDescription.substring(0, 1000)}

**הנרטיב חייב לשקף בדיוק את התיאור הזה.** אל תסטה ממנו לטובת עלילה גנרית.

⚠️ **כלל הסתרה — חובה מוחלטת:** הטקסט שלמעלה הוא הנחיית פרומפט בלבד עבורך כסופר. **אסור** לצטט אותו מילולית בסיפור. **אסור** שמשפט כלשהו מתוכו יופיע כפי שהוא בעמודי הסיפור או ככותרת. השתמש בו רק כהשראה לתוכן ולקונפליקט — כתוב סיפור מקורי, ספרותי ומחורז שמשקף את הרעיון מבלי להעתיק את הנוסח.
` : ""}
${["moses-basket","exodus","noah-ark","joseph-brothers","david-goliath","abraham-sarah","jonah-fish","samson-hero","esther-queen","hanukkah-miracle"].includes(topic) || ["משה בתיבה","יציאת מצרים","נח ותיבת נח","יוסף ואחיו","דוד וגוליית","אברהם ושרה","יונה והדג הגדול","שמשון הגיבור","אסתר המלכה","נס חנוכה"].includes(topic) ? `
## 📜 הנחיה מיוחדת — סיפור תורה (חובה לעקוב!)
ספר את הסיפור התנ"כי בנאמנות לעלילה המקורית אבל בשפה חמה, פשוטה ומותאמת לגיל 2-8.
ללא אלימות מפורשת, ללא פחד. הדגש על אהבה, נס, אומץ ומשפחה.

### ⏳ מנגנון "מטייל/ת בזמן" — כלל חובה!
${childName} הוא/היא ילד/ה מודרני/ת שמגיע/ה לעולם התנ"כי דרך מסע קסום בזמן.
- בתחילת הסיפור, ${childName} מגלה/ת פורטל קסום (ספר עתיק שנפתח, קשת בענן שמאירה, מערה מסתורית, כוכב נופל וכד') שלוקח/ת אותו/ה אחורה בזמן.
- ${childName} מגיע/ה כ**אורח/ת קסום/ה** ו**פוגש/ת** את הדמויות התנ"כיות — לא חי/ה באותה תקופה!
- ❌ אסור בהחלט: "${childName} חי/ה בימי נח" / "${childName} גדל/ה במצרים"
- ✅ נכון: "${childName} הגיע/ה דרך פורטל קסום ופגש/ה את נח" / "${childName} מצא/ה את עצמו/ה ליד הים ושם פגש/ה את משה"
- ${childName} צופה בנס, משתתף/ת בו ברמה של ילד/ה (עוזר/ת, מעודד/ת, שואל/ת שאלות), אך לא מוביל/ת את האירוע התנ"כי עצמו.
- בסוף הסיפור, ${childName} חוזר/ת הביתה עם הלקח והזיכרון הקסום.
` : ""}
- **הנושא הנבחר הוא התבנית (השלד) המחייבת לסיפור. היצמד לערכי הנושא באדיקות.**
- **כל סצנה חייבת להיות ספציפית ועשירה סביב הערך שנשלח מבסיס הנתונים.**
- **חשוב מאוד:** השם "${childName}" הוא השם היחיד שישמש לאורך כל הסיפור. אל תשתמש בשמות אחרים כמו "סול" או כל שם שאינו השם שהוזן. "סול" הוא שם לדוגמה בלבד ואינו רלוונטי לסיפור.
- השתמש בנושא שנשלח אליך מהאפליקציה כ**עוגן המרכזי** של הסיפור - התייחס אליו כאל הנושא המחייב, ללא קשר לרשימה קבועה.
- שלב את הפרטים האישיים (שם הילד, תכונות, תחביבים, חברים) בתוך הנושא בצורה אורגנית וטבעית.
- צור תוכן עמוק, מרגש ומקורי בתוך הנושא - הסיפור חייב להרגיש מותאם אישית ולא כמו טקסט קבוע מראש. אל תשתמש בסיפורים גנריים.
- אל תכתוב סיפור שטחי או גנרי. כל סצנה צריכה להיות ספציפית, עשירה ומפתיעה.

## 🌍 עולם SolStorie's™ - דמויות משנה (Supporting Characters)
**כאשר העלילה דורשת חברים או דמויות תומכות מעבר לגיבור הראשי, אין ליצור דמויות חדשות אקראיות!**
השתמש אך ורק ב"חברים של סול" - הקאסט הקבוע של עולם SolStorie's™:
1. **סול (Sol) - המארחת/מרכז העולם** - תפקיד: הרפתקה ורגש. לובשת שמלה צהובה בהירה, שיער חום ארוך וישר עד גלי קלות אסוף בקוקו גבוה, עיניים חומות. לעיתים קרובות מחזיקה מצפן. סול היא דמות הרקע של העולם - היא יכולה להופיע כדמות תומכת אך הגיבור הראשי הוא תמיד הילד של המשתמש.
2. **מיה (Mia) - ילדת הטבע** - תפקיד: טבע, בעלי חיים וקסם. לובשת שמלה ירוקה, **שיער חום קצר וישר בתספורת בוב (bob cut)**. אוהבת טבע ובעלי חיים (נראית לעיתים קרובות עם פרפרים או ארנבונים).
3. **ליאו (Leo) - הילד החכם** - תפקיד: מדע, חלל ותעלומות. לובש אפודת סוודר כחולה ומשקפיים, שיער שחור. אוהב לקרוא ותמיד שואל "למה?". לעיתים קרובות מחזיק ספר או טלסקופ.
4. **זואי (Zoe) - הילדה הספורטיבית** - תפקיד: פעולה, ספורט ואנרגיה. לובשת חליפת ספורט סגולה-צהובה, שיער מתולתל/אפרו גדול ושופע, **גוון עור כהה**. לעיתים קרובות מחזיקה כדורגל. נמרצת ואמיצה.
5. **בן (Ben) - אחיה הקטן של סול** - תפקיד: פעוט, אחות גדולה, משפחה. לובש חולצה ירוקה בהירה או תכולה, שיער חום כהה מתולתל מאוד ונפחי. פעוט חמוד שתמיד הולך בעקבות סול. **חשוב: כאשר בן וסול מופיעים ביחד בסיפור, יש לתאר אותם כאחים — השתמש בביטויים: "אחיה הקטן", "אחותו הגדולה", "ביניהם כימיה של אחים".**
- **שלב 1-2 מהחברים האלו לפי הצורך** - בחר את הדמויות המתאימות ביותר לנושא הסיפור. השתמש בשמות הדמויות (מיה, ליאו, זואי, בן) בטקסט הסיפור.
- באיורים (illustration_prompt), תאר את מראה החברים בדיוק לפי התיאורים למעלה כדי לשמור על עקביות ויזואלית.

**⚠️ כלל אחים מחייב:** כאשר בן מופיע בסיפור שבו גם סול נוכחת, **אסור** לתארם כחברים. השתמש תמיד בשפה של אחווה: "בֶּן, אָחִיהָ הַקָּטָן שֶׁל סוֹל", "סוֹל הִבִּיטָה בְּאָחִיהָ הַקָּטָן", "שְׁנֵי הָאַחִים". הם משפחה, לא חברים.

${topic.endsWith('-edu') ? `
## 🎓 מנוע סיפורי העצמה חברתיים - חובה לנושאי חינוך!
הנושא הנבחר הוא מקטגוריה חינוכית. יש ליישם את העקרונות הבאים:

### יחס 3:1 (תיאורי/פרספקטיבי מול הנחייתי)
- לפחות 3 משפטים תיאוריים או פרספקטיביים (מתארים מצב, רגש, תחושה) לכל משפט הנחייתי אחד (שמציע פעולה).
- דוגמה: "הַיְלָדִים יוֹשְׁבִים בְּמַעְגָּל. כֻּלָּם מַרְגִּישִׁים שִׂמְחָה. הָאֲוִירָה חַמָּה וּנְעִימָה. אֶפְשָׁר לְנַסּוֹת לְסַפֵּר מָה קָרָה הַיּוֹם."

### גוף ראשון או שלישי בלבד
- אין פנייה ישירה בגוף שני ("אתה/את"). השתמש רק בגוף ראשון ("אני מרגיש/ה...") או גוף שלישי ("הילד/ה מרגיש/ה...").
- ❌ אסור: "אתה צריך לנשום עמוק" | ✅ נכון: "אפשר לנשום עמוק ולהרגיש רגוע"

### טון חיובי, מרגיע ולא סמכותי
- ללא ציוויים ("תעשה!", "אל תעשה!"). במקום זאת, השתמש בניסוח רך: "אפשר...", "לפעמים עוזר...", "כיף לגלות ש..."
- הסיפור מרגיע ומעודד, לא מלמד מוסר ולא מטיף.

### מודעות חושית ואסטרטגיות התמודדות
- שלב פרטים חושיים: צלילים ("הרוח שורקת בחוץ"), תחושות גופניות ("הלב פועם מהר קצת"), ריחות ומגע.
- שלב אסטרטגיות התמודדות בצורה טבעית: נשימות עמוקות, ספירה עד 5, חיבוק עצמי, מקום בטוח בדמיון.
` : ''}
## איכות השפה והחרוזים - קריטי! (V2 Strict Enforcement)
- כתוב כמו סופר/ת ילדים ישראלי/ת עטור/ת פרסים (דתיה בן דור, יונתן גפן, מאיר שלו)
- **חרוז רק כשהוא טבעי, הגיוני ורלוונטי לעלילה!** אם אין חרוז כזה - כתוב פרוזה ברורה ומרתקת.
- **אסור בהחלט:** להמציא מילים, להכניס מושגים לא רלוונטיים, או ליצור קשרים לוגיים שגויים רק כדי לחרוז.
- הקצב חייב לזרום - מספר הברות דומה בכל שורה
- **כתוב עם ניקוד מלא ומדויק לכל מילה!**
- אסור משפטים שנשמעים מתורגמים
- השתמש בביטויים ישראליים טבעיים ויומיומיים
- פיסוק נכון: נקודה/פסיק בסוף שורת שיר
- אין לציין "קראו לי" או השמעה קולית
- **שלב לפחות 3 פרטים ספציפיים מהתיאור החופשי של ההורה!**
- **שימוש ב-NLP:** חיזוקים חיוביים, אסטרטגיות התמודדות, שפה צמיחתית

## עימוד ומבנה הטקסט - קריטי!
- **כל בית (stanza) מופרד בשורה ריקה** - הטקסט חייב "לנשום"!
- אסור גושי טקסט דחוסים - כל עמוד מכיל בית אחד בלבד (2-4 שורות)
- הטקסט חייב להיראות מסודר, אוורירי וקל לקריאה של הורה עייף בלילה
- כל שורה בבית קצרה ונעימה - לא יותר מ-8 מילים בשורה

## תיקוני שפה חובה:
- במקום "וכסמה את ראשה" → "וחבשה קסדה על ראשה"
- במקום "כסמה" → "חבשה קסדה"
- במקום "עטתה" → "לבשה"
- במקום "הביטה" → "הסתכלה"

## 🛡️ ניקוד ושפה - חובה!
**כתוב עם ניקוד מלא ומדויק לכל מילה!**
- וודא שכל מילה קיימת בעברית מודרנית.
- העדף פעלים פשוטים: "מסתכלת" במקום "מופנות", "חושבת" במקום "מהרהרת".
- כלל: אם לא בטוח ב-100% שהמילה קיימת - השתמש באלטרנטיבה פשוטה.
- כלל ניקוד: אם לא בטוח ב-100% בניקוד - השתמש במילה שאתה בטוח בניקוד שלה.`;
    }

    // === COST OPTIMIZATION: instruct AI to emit `illustration_prompt` ONLY for
    // pages that will actually be illustrated (see parity/toddler logic near line
    // ~2020). Other pages must OMIT the field entirely — saves output tokens.
    // The model may still mentally visualize the scene for narrative coherence,
    // but it must not serialize the field for non-illustrated pages.
    const illustrationRuleEn = `

## 🖼️ Illustration prompt field — output rule (MANDATORY, cost-critical)
- Include the "illustration_prompt" field in the JSON ONLY for these page_numbers: [${illustrationPagesListStr}].
- For every OTHER page, DO NOT include an "illustration_prompt" key at all — not empty string, not null, not placeholder. Just omit the field.
- You MAY still mentally visualize the scene for those pages to keep the narrative coherent, but do not serialize it.
- The text quality, plot, and per-page word counts must remain exactly as instructed above — this rule affects only the JSON output shape.`;
    const illustrationRuleHe = `

## 🖼️ שדה illustration_prompt — כלל פלט (חובה, קריטי לעלות)
- כלול את השדה "illustration_prompt" ב-JSON **רק** בעמודים הבאים: [${illustrationPagesListStr}].
- בכל שאר העמודים **אל תכלול** את המפתח "illustration_prompt" בכלל — לא מחרוזת ריקה, לא null, לא placeholder. פשוט השמט את השדה.
- מותר לך "לדמיין" בפנימיות את הסצנה גם בעמודים האחרים כדי לשמור על קוהרנטיות הסיפור, אבל אל תוציא אותה ל-JSON.
- איכות הטקסט, העלילה ומספר המילים לעמוד חייבים להישאר בדיוק לפי ההנחיות למעלה — הכלל הזה משפיע רק על צורת ה-JSON.`;
    userPrompt = userPrompt + (language === "en" ? illustrationRuleEn : illustrationRuleHe);

    console.log("[generate-story] 📡 Calling Lovable AI Gateway (google/gemini-2.5-flash) with retry logic...");
    const geminiResult = await callGatewayWithRetry({
      apiKey: LOVABLE_API_KEY,
      label: "generate-story",
      maxRetries: 4,
      timeoutMs: 120_000,
      maxOutputTokens: 8192,
      systemPrompt: systemPrompt,
      userPrompt: userPrompt,
      jsonMode: true,
    });

    if (!geminiResult.ok) {
      console.error(`[generate-story] ❌ AI Gateway failed after retries: status=${geminiResult.status}`);
      await logError("story_generation_error", `AI Gateway error: ${geminiResult.status}`, { status: geminiResult.status, body: geminiResult.body.substring(0, 500), topic, childName, isBillingError: geminiResult.isBillingError }, userId ?? undefined);
      
      if (geminiResult.isBillingError) {
        return new Response(
          JSON.stringify({ error: "שגיאת מערכת זמנית. נסו שוב בעוד מספר דקות." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (geminiResult.status === 429) {
        return new Response(
          JSON.stringify({ error: "הגעתם למגבלת הבקשות. נסו שוב בעוד מספר דקות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (geminiResult.status === 401 || geminiResult.status === 403) {
        return new Response(
          JSON.stringify({ error: "שגיאת הרשאה. אנא צרו קשר עם התמיכה." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב מאוחר יותר.");
    }

    console.log("[generate-story] ✅ AI Gateway response received, parsing...");
    const content = geminiResult.text;
    
    if (!content) {
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
    }

    console.log("AI response received, parsing...");

    // === Helper: clean raw AI content into parseable JSON string ===
    function cleanAiContent(raw: string): string {
      let c = raw.trim();
      c = c.replace(/```json\n?|\n?```/g, '').trim();
      // Strip Hebrew nikud (vowel marks) — they break JSON parsing and will be added later
      c = c.replace(/[\u0591-\u05C7]/g, '');
      // Remove non-printable control chars
      c = c.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Escape raw newlines/tabs AND stray unescaped quotes inside JSON string values.
      // A `"` is treated as a real string terminator only if the next non-whitespace
      // character is one of: , } ] : (i.e. a valid JSON delimiter). Otherwise it's
      // an embedded quote inside the string value and must be escaped.
      let inString = false;
      let escaped = false;
      let result = '';
      for (let i = 0; i < c.length; i++) {
        const ch = c[i];
        if (escaped) { result += ch; escaped = false; continue; }
        if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
        if (ch === '"') {
          if (inString) {
            // Look ahead: is this a real string terminator?
            let j = i + 1;
            while (j < c.length && (c[j] === ' ' || c[j] === '\n' || c[j] === '\r' || c[j] === '\t')) j++;
            const next = c[j];
            if (next === ',' || next === '}' || next === ']' || next === ':' || j >= c.length) {
              inString = false;
              result += ch;
            } else {
              // Stray quote inside string value — escape it
              result += '\\"';
            }
          } else {
            inString = true;
            result += ch;
          }
          continue;
        }
        if (inString) {
          if (ch === '\n') { result += '\\n'; continue; }
          if (ch === '\r') { result += '\\r'; continue; }
          if (ch === '\t') { result += '\\t'; continue; }
        }
        result += ch;
      }
      return result;
    }

    // === Helper: attempt to repair truncated JSON ===
    function repairTruncatedJson(raw: string): string {
      let s = raw;
      // If we're inside an unclosed string, close it
      let inStr = false;
      let esc = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\' && inStr) { esc = true; continue; }
        if (ch === '"') inStr = !inStr;
      }
      if (inStr) s += '"';
      // Close any unclosed brackets/braces
      const stack: string[] = [];
      inStr = false; esc = false;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\' && inStr) { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{' || ch === '[') stack.push(ch);
        if (ch === '}' && stack.length && stack[stack.length - 1] === '{') stack.pop();
        if (ch === ']' && stack.length && stack[stack.length - 1] === '[') stack.pop();
      }
      // Remove trailing comma before closing
      s = s.replace(/,\s*$/, '');
      // Close unclosed structures
      while (stack.length) {
        const open = stack.pop();
        s += open === '{' ? '}' : ']';
      }
      return s;
    }

    let storyData;
    const cleanedResult = cleanAiContent(content);
    
    // Attempt 1: parse directly
    try {
      storyData = JSON.parse(cleanedResult);
    } catch (_e1) {
      console.warn("[generate-story] Direct JSON parse failed, attempting repair...");
      // Attempt 2: repair truncated JSON
      try {
        const repaired = repairTruncatedJson(cleanedResult);
        storyData = JSON.parse(repaired);
        console.log("[generate-story] Truncated JSON repaired successfully");
      } catch (_e2) {
        console.warn("[generate-story] Repair failed, retrying AI call...");
        // Attempt 3: retry the AI call with retry helper
        try {
          const retryResult = await callGatewayWithRetry({
            apiKey: LOVABLE_API_KEY,
            label: "generate-story-retry",
            maxRetries: 2,
            timeoutMs: 120_000,
            systemPrompt: systemPrompt,
            userPrompt: userPrompt,
            jsonMode: true,
          });
          if (!retryResult.ok) {
            console.error(`[generate-story] Retry AI call failed: ${retryResult.status}`);
            throw new Error("Retry failed");
          }
          const retryContent = retryResult.text;
          if (!retryContent) throw new Error("Empty retry response");
          const cleanedRetry = cleanAiContent(retryContent);
          storyData = JSON.parse(cleanedRetry);
          console.log("[generate-story] ✅ Retry succeeded");
        } catch (retryErr) {
          console.error("[generate-story] All parse attempts failed:", retryErr);
          await logError("story_parse_error", `All JSON parse attempts failed`, { 
            parseError: String(_e1), 
            repairError: String(_e2),
            retryError: String(retryErr),
            contentPreview: content?.substring(0, 500), 
            topic, childName 
          }, userId ?? undefined);
          throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
        }
      }
    }
    
    // Validate story structure
    if (!storyData.pages || !Array.isArray(storyData.pages) || storyData.pages.length === 0) {
      console.error("Invalid story structure:", JSON.stringify(storyData).substring(0, 300));
      await logError("story_parse_error", `Invalid story structure from AI`, { keys: Object.keys(storyData), topic, childName }, userId ?? undefined);
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
    }
    
    console.log(`Story parsed successfully with ${storyData.pages.length} pages`);

    // === DEFERRED CREDIT DEDUCTION: Only after successful AI generation ===
    if (userId && !guestMode) {
      // Atomic check-and-decrement via optimistic concurrency (CAS):
      // UPDATE ... WHERE id = ? AND story_credits = expected AND story_credits > 0
      // If no row is returned, another request decremented in between — retry up to 3x.
      let deducted = false;
      for (let attempt = 0; attempt < 3 && !deducted; attempt++) {
        const { data: freshProfile } = await supabase
          .from("profiles")
          .select("story_credits")
          .eq("id", userId)
          .single();

        const freshCredits = freshProfile?.story_credits ?? 0;
        if (freshCredits <= 0) {
          console.log("Race condition: credits depleted between check and deduction");
          return new Response(
            JSON.stringify({ error: "נגמרו הקרדיטים", code: "NO_CREDITS" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: updatedRows, error: deductError } = await supabase
          .from("profiles")
          .update({ story_credits: freshCredits - 1 })
          .eq("id", userId)
          .eq("story_credits", freshCredits)
          .gt("story_credits", 0)
          .select("story_credits");

        if (deductError) {
          console.error("Error deducting credit:", deductError);
          break;
        }
        if (updatedRows && updatedRows.length > 0) {
          console.log(`Credit deducted atomically: ${freshCredits} → ${freshCredits - 1}`);
          deducted = true;
        } else {
          console.warn(`CAS miss on credit deduction (attempt ${attempt + 1}), retrying`);
        }
      }
      if (!deducted) {
        return new Response(
          JSON.stringify({ error: "נגמרו הקרדיטים", code: "NO_CREDITS" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // === TEXT QUALITY REWRITE: Age-appropriate language polish ===
    if (language === "en") {
      console.log("[generate-story] Skipping Hebrew text quality rewrite for English story");
    } else try {
      const ageLabel = ageRange === "0-2" ? "2" : ageRange === "2-4" ? "3" : ageRange === "5-7" ? "6" : "8";
      const fullStoryText = storyData.pages.map((p: any) => `[עמוד ${p.page_number}]\n${p.text}`).join("\n\n");
      
      const rewritePrompt = `You are an expert in Hebrew children's literature, NLP-based text analysis, and autism-friendly writing.

You will receive a Hebrew children's story and the child's age.
Your job is to rewrite it in warm, everyday Hebrew — like a parent telling a bedtime story.

STYLE — EVERYDAY HEBREW (עברית יומיומית):
- Warm, natural, simple Hebrew — like an Israeli parent talking to their child before bed
- NOT literary, NOT poetic, NOT heavy — simple and flowing
- Sensory descriptions are good (smells, sounds, touch) but in everyday language
- Warmth and intimacy between characters — loving touch, eye contact, closeness
- NO archaic words (לפנים, נקיפת הימים, מסברת, מבעקים, קמעה, נוגה, חרישית, etc.)
- NO literary/formal expressions — replace them with everyday equivalents:
  ❌ "מלך על סוס" → ✅ "רכב על סוס"
  ❌ "צעד בגאון" → ✅ "הלך בשמחה"
  ❌ "חש בנפשו" → ✅ "הרגיש בלב"
  ❌ "נשא עיניו" → ✅ "הסתכל למעלה"
  ❌ "פסע לאיטו" → ✅ "הלך לאט"
- Golden rule: if a 5-year-old wouldn't use this word in regular conversation — don't use it.

NLP & EMOTIONAL GUIDELINES:
- Positive reinforcement and growth mindset language
- Anchor positive feelings in the body: 'הלב מתחמם', 'הבטן נרגעת'
- Normalize difficult emotions: 'זה בסדר להרגיש ככה, כולם מרגישים ככה לפעמים'
- Use only concrete, simple metaphors: 'הכעס כמו בלון שמתנפח' ✅, 'הנשמה עפה' ❌
- The child should feel seen, understood, and capable

AUTISM-FRIENDLY RULES:
- Short, clear sentences — no ambiguity, no double meanings
- Always explain WHY a character feels something: 'הוא הרגיש עצוב כי החבר לא שיחק איתו' ✅
- Calming repetition of reassuring phrases: 'והכל בסדר', 'הוא יודע שהוא יכול'
- No sudden plot surprises or scary elements
- Clear logical sequence — each page follows logically from the previous one

FORMATTING — CRITICAL:
- **Each sentence must be on its own line** (newline after every period/sentence end)
- Empty line between paragraphs
- Short, rhythmic sentences — not dense blocks of text
- Example format:
  "אמא שלה מסתכלת עליה באהבה.
  השמש החמימה נכנסת דרך החלון ומלטפת את הבית באור זהב.

  פתאום, מבחוץ, נשמע צליל מיוחד.
  זהו צליל ארוך, שעולה ויורד, כמו שיר שהרוח שרה מרחוק."

NLP RULES BY AGE:
- Age 2-3: Max 4 words per sentence, very simple vocabulary
- Age 4-5: Max 7 words per sentence, concrete concepts only
- Age 6-8: Up to 10 words, can include some abstract concepts but still everyday language

CRITICAL RULES:
- Keep the EXACT same number of pages/sections as the input
- Keep [עמוד X] markers exactly as they are
- The child's name in the story is "${childName}". Preserve it EXACTLY as it appears — never replace, shorten, transliterate, or "correct" it.
- The name "${childName}" must be spelled IDENTICALLY on every page — never add or drop a letter (e.g. never turn a short name into a longer similar-looking word).
- **אסור "רשימת בגדים":** אם עמוד כלשהו מתאר בגדים בסגנון טכני ("מעל החולצה, יש לו מכנסיים אדומים. למטה, יש לו טייץ כחול. יש לו גם גלימה אדומה.") — נסח אותו מחדש כמשפט סיפורי אחד שמחבר את הלבוש לרגש ולפעולה, למשל: "${childName} לובש/ת את התלבושת האהובה — חולצה צהובה, מכנסיים אדומים וגלימה שמתנופפת ברוח. הוא/היא מוכן/ה להרפתקה!"
- Fix spelling mistakes in Hebrew words (e.g. "כחל" → "כחול").
- Preserve illustration_prompt content if present - only rewrite the Hebrew story text
- Do NOT add nikud (vowel marks) — write clean text without nikud
- Do NOT flatten sentence-per-line formatting into paragraphs
- Do NOT remove sensory descriptions (smells, sounds, touch) — enhance them in simple language!
- Do NOT add any explanation, just return the rewritten text
- **אסור** להוסיף או להשאיר ציון גיל מספרי בטקסט (לא "בת שלוש", לא "בן 5", לא "ילדה בת ארבע"). אם קיים בקלט — להסיר את ציון הגיל או לנסח מחדש בלי המספר.

CHECKLIST before returning:
✓ Every sentence fits the age level
✓ No archaic or literary vocabulary — everyday Hebrew only
✓ Each sentence sounds like something an Israeli parent would actually say
✓ Each sentence on its own line
✓ Sensory language preserved in simple words
✓ Warmth and intimacy between characters preserved
✓ Emotions are explained (why the character feels that way)
✓ No nikud in text
✓ No spelling errors

Return ONLY the corrected story text with the same [עמוד X] structure, nothing else.

Child age: ${ageLabel}
Story:
${fullStoryText}`;
      
      console.log(`[generate-story] Starting text quality rewrite for age ${ageLabel} (12s timeout)...`);
      
      const rewriteResult = await callGatewayWithRetry({
        apiKey: LOVABLE_API_KEY,
        label: "rewrite",
        maxRetries: 1,
        timeoutMs: 12_000,
        userPrompt: rewritePrompt,
      });

      if (rewriteResult.ok) {
        const rewrittenText = rewriteResult.text?.trim();
        
        if (rewrittenText) {
          // Parse rewritten text back into pages by [עמוד X] markers
          const pageBlocks = rewrittenText.split(/\[עמוד\s+(\d+)\]/).filter((s: string) => s.trim());
          let updatedCount = 0;
          
          for (let i = 0; i < pageBlocks.length - 1; i += 2) {
            const pageNum = parseInt(pageBlocks[i]);
            const pageText = pageBlocks[i + 1]?.trim();
            if (!isNaN(pageNum) && pageText) {
              const targetPage = storyData.pages.find((p: any) => p.page_number === pageNum);
              if (targetPage) {
                targetPage.text = pageText;
                updatedCount++;
              }
            }
          }
          
          console.log(`[generate-story] ✅ Text rewrite complete: ${updatedCount}/${storyData.pages.length} pages updated`);
        } else {
          console.warn("[generate-story] Text rewrite returned empty, using original text");
        }
      } else {
        console.warn(`[generate-story] Text rewrite failed (${rewriteResult.status}), using original text`);
      }
    } catch (rewriteErr) {
      console.warn("[generate-story] Text rewrite error, using original text:", rewriteErr);
    }

    // === SANITIZE: strip any leaked page markers like [עמוד N] / [Page N] from page text ===
    // These markers are an internal scaffolding used by the rewrite/nikud passes and must
    // never appear inside the visible story text.
    const PAGE_MARKER_RE = /\[\s*(?:עמוד|page|עמ׳|עמ\.?)\s*\d+\s*\]/gi;
    for (const p of storyData.pages as any[]) {
      if (typeof p.text === "string" && PAGE_MARKER_RE.test(p.text)) {
        p.text = p.text.replace(PAGE_MARKER_RE, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      }
    }

    // === NAME CONSISTENCY: the hero's name must be identical on every page ===
    for (const p of storyData.pages as any[]) {
      if (typeof p.text === "string") p.text = enforceChildName(p.text, childName);
    }
    if (typeof storyData.title === "string") {
      storyData.title = enforceChildName(storyData.title, childName);
    }

    // === NIKUD: Deferred to background for faster response ===
    // Nikud will be applied after story+pages are saved, in a fire-and-forget manner
    // Auto-apply nikud for ages 0-4 regardless of parent toggle.
    const isYoungAge = ageRange === "0-2" || ageRange === "2-4";
    const shouldApplyNikud = (nikud || isYoungAge) && language === "he";
    if (!shouldApplyNikud) {
      console.log("Nikud not requested, skipping");
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
      language: language,
      generation_status: "generating_illustrations",
      story_type: isCustomTopic ? "custom" : "text",
      child_photo_url: childPhoto || childAvatarUrl || null,
    };

    
    // Only add user_id if we have one (for gallery privacy)
    if (userId) {
      storyInsertData.user_id = userId;
    }
    
    // Save child_id if provided
    if (childId) {
      storyInsertData.child_id = childId;
    }
    
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert(storyInsertData)
      .select()
      .single();

    if (storyError) {
      console.error("Error creating story:", storyError);
      await logError("story_insert_error", `Story insert failed: ${storyError.message}`, { code: storyError.code, topic, childName }, userId ?? undefined);
      throw storyError;
    }

    console.log("Story created:", story.id);

    // Insert pages - illustration assignment strategy depends on age
    // Age 0-2: EVERY page gets an illustration_prompt (+ illustration_prompt_2 for dual layout)
    // Other ages: Odd pages (1, 3, 5...) get illustration prompts; even pages are text-only
    const isToddlerAge = ageRange === "0-2";
    // Track how many times we had to synthesize a fallback illustration_prompt
    // because the model omitted it on a page that requires an illustration.
    // Rare by design (see the MANDATORY output rule above). We log every hit
    // so we can catch a regression where the model starts omitting broadly.
    let fallbackPromptCount = 0;
    const buildFallbackPromptFromText = (pageText: string, pageNumber: number): string => {
      const safeText = (pageText || "").toString().trim().slice(0, 600);
      const genderWord =
        childGender === "female" ? "girl" : childGender === "male" ? "boy" : "child";
      // Deterministic, no extra AI call: derive a scene prompt directly from the
      // page text so the illustration still matches this page exactly.
      return `A children's book illustration for page ${pageNumber}. Illustrate EXACTLY what happens in this page's story text: "${safeText}". The main character is a ${genderWord} named ${childName}, aged ${ageRange}. Show the specific action, environment, objects, and characters mentioned in the text — do not invent a different scene. Character appearance and outfit must match the rest of the storybook.`;
    };
    const pagesWithoutIllustrations = storyData.pages.map((page: any) => {
      const shouldHaveIllustration = isToddlerAge || (page.page_number % 2 === 1);
      let promptForPage: string | null = shouldHaveIllustration ? page.illustration_prompt : null;
      // SAFETY NET: model was told to always include illustration_prompt on
      // required pages, but if it slipped, synthesize one from the page text
      // so the paid story never ships with a missing illustration.
      if (shouldHaveIllustration && (!promptForPage || String(promptForPage).trim() === "")) {
        promptForPage = buildFallbackPromptFromText(page.text, page.page_number);
        fallbackPromptCount += 1;
        console.warn(
          `Fallback illustration prompt generated for page ${page.page_number} - model omitted prompt`,
        );
      }
      return {
        story_id: story.id,
        page_number: page.page_number,
        text: page.text,
        illustration_prompt: promptForPage,
        illustration_prompt_2: isToddlerAge && page.illustration_prompt
          ? `Same scene as the main illustration but from a DIFFERENT camera angle or showing the NEXT moment in the action. Original scene: ${page.illustration_prompt}`
          : null,
        illustration_url: null,
        illustration_url_2: null,
      };
    });
    if (fallbackPromptCount > 0) {
      console.warn(
        `⚠️ illustration_prompt fallback triggered ${fallbackPromptCount} time(s) for story ${story.id} (age ${ageRange}, ${storyData.pages.length} pages)`,
      );
      await logError(
        "illustration_prompt_fallback",
        `Model omitted illustration_prompt on ${fallbackPromptCount} required page(s)`,
        { story_id: story.id, age_range: ageRange, total_pages: storyData.pages.length, fallback_count: fallbackPromptCount },
        userId ?? undefined,
      );
    }

    // For learning topics, override the LAST page's illustration prompt
    if (isLearningTopic && pagesWithoutIllustrations.length > 0) {
      const lastPage = pagesWithoutIllustrations[pagesWithoutIllustrations.length - 1];
      lastPage.illustration_prompt = learningColor
        ? `The child ${childName} stands in a magical scene completely flooded with ${hebrewLearningTarget} color. The background, sky, flowers, objects and clothing are all in shades of ${hebrewLearningTarget}. Disney/Pixar 3D style. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
        : learningShape
        ? `The child ${childName} stands surrounded by giant and small ${hebrewLearningTarget} shapes floating around them in a magical colorful scene. One huge glowing ${hebrewLearningTarget} shape dominates the center. Disney/Pixar 3D style. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
        : learningLetter
        ? `The child ${childName} is positioned to the SIDE, looking up at a giant glowing Hebrew letter ${hebrewLearningTarget} which is placed in the exact CENTER of the image. The letter ${hebrewLearningTarget} must be FULLY VISIBLE, COMPLETE, and NOT CROPPED in any direction — with generous clear space around it on ALL sides, never touching any edge of the frame. The letter is large, bold, 3D golden glowing style, perfectly centered. The child must NOT obscure or overlap the letter. Wide shot showing both the child to the side and the complete letter in the center. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`
        : `The child ${childName} stands next to the giant glowing Arabic numeral digit ${learningNumber} (NOT a Hebrew letter), which fills half the image and is fully visible, not cropped. The number is large, clear, bold, 3D golden style, complete and uncut. Wide shot showing both the child and the full number. Full body shot of the child, showing complete figure from head to toe. Do NOT cut off any body parts. Full bleed, no white margins, no borders, image fills entire frame edge to edge.`;
    }

    // === WARDROBE DRIFT DETECTION (logging only) ===
    try {
      checkWardrobeDrift(pagesWithoutIllustrations, story.id);
    } catch (e) {
      console.warn("[WARDROBE_DRIFT] check failed (ignored):", (e as Error)?.message);
    }

    const { error: pagesError } = await supabase
      .from("story_pages")
      .insert(pagesWithoutIllustrations);

    if (pagesError) {
      console.error("Error creating pages:", pagesError);
      throw pagesError;
    }

    // === DEFERRED SUMMARY: runs in parallel with illustrations ===
    const summaryPromise = (async () => {
      try {
        const fullText = storyData.pages.map((p: any) => p.text).join("\n");
        const summaryResult = await callGatewayWithRetry({
          apiKey: LOVABLE_API_KEY,
          label: "summary",
          maxRetries: 1,
          timeoutMs: 10_000,
          userPrompt: `סכם את הסיפור הבא במשפט אחד קצר בעברית (עד 30 מילים). תן רק את המשפט, ללא הקדמה:\n${fullText}`,
        });
        if (summaryResult.ok) {
          const summary = summaryResult.text?.trim();
          if (summary) {
            await supabase.from("stories").update({ summary }).eq("id", story.id);
            console.log(`Summary saved for story ${story.id}: ${summary.substring(0, 60)}...`);
          }
        }
      } catch (err) {
        console.error("Background summary generation error:", err);
      }
    })();

    // === DEFERRED NIKUD: runs in parallel with illustrations ===
    let nikudPromise: Promise<void> = Promise.resolve();
    if (shouldApplyNikud) {
      console.log("Deferring nikud to parallel processing...");
      nikudPromise = (async () => {
        try {
          const { data: savedPages } = await supabase
            .from("story_pages")
            .select("id, text, page_number")
            .eq("story_id", story.id)
            .order("page_number");
          
          if (savedPages) {
            const nikudResults = await Promise.allSettled(
              savedPages.map(async (page) => {
                const nikudText = await addNikudToText(page.text, LOVABLE_API_KEY);
                if (nikudText !== page.text) {
                  await supabase
                    .from("story_pages")
                    .update({ text: nikudText })
                    .eq("id", page.id);
                }
              })
            );
            console.log(`Nikud: ${nikudResults.filter(r => r.status === 'fulfilled').length}/${nikudResults.length} pages updated`);
          }
        } catch (err) {
          console.error("Background nikud error:", err);
        }
      })();
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
      // === DISTRIBUTED ILLUSTRATION GENERATION ===
      // Fire a SEPARATE call for each page that needs an illustration.
      // Each invocation handles one page (~80s), staying well within the Edge Function timeout (~150s).
      const illustrationPages = pagesWithoutIllustrations.filter((p: any) => p.illustration_prompt);
      console.log(`Triggering ${illustrationPages.length} separate generate-illustrations calls (one per page)...`);

      // Collect all fetch promises — we MUST await them before returning
      // so the Deno runtime doesn't kill them when the response is sent.
      const fetchPromises: Promise<void>[] = [];

      // Nikud and summary run as true background tasks — don't block response
      // Reference them so Deno doesn't GC before completion
      Promise.allSettled([summaryPromise, nikudPromise]).then(() => {
        console.log("Background nikud + summary completed");
      });

      for (const page of illustrationPages) {
        console.log(`  → Dispatching illustration for page ${page.page_number}`);
        const p = fetch(`${supabaseUrl}/functions/v1/generate-illustrations`, {
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
            userId: userId,
            childName: childName,
            topic: topic,
            singlePageNumber: page.page_number,
          }),
        }).then(response => {
          console.log(`generate-illustrations (page ${page.page_number}) response: ${response.status}`);
          if (!response.ok) {
            response.text().then(text => {
              console.error(`generate-illustrations page ${page.page_number} error:`, text);
            });
          }
        }).catch(err => {
          console.error(`Error triggering illustration for page ${page.page_number}:`, err);
        });
        fetchPromises.push(p);
      }

      // No separate cover generation: page 1's illustration is used as the book cover
      // (generate-illustrations syncs stories.cover_url once page 1 is saved).

      // Wait for dispatch with a 3-second timeout — only need HTTP acceptance
      await Promise.race([
        Promise.allSettled(fetchPromises),
        new Promise<void>(resolve => setTimeout(() => {
          console.warn("Dispatch timeout reached (3s) — proceeding with response");
          resolve();
        }, 3000)),
      ]);
      console.log(`All ${fetchPromises.length} generation requests dispatched`);
    }

    console.log("Illustration + cover generation triggered, returning storyId immediately");

    return new Response(
      JSON.stringify({ 
        storyId: story.id,
        message: "Story text created, illustrations generating in background",
        status: "generating_illustrations"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const crashMessage = error instanceof Error ? error.message : String(error);
    const crashStack = error instanceof Error ? error.stack : undefined;
    console.error("[generate-story] CRASH:", crashMessage);
    if (crashStack) console.error("[generate-story] STACK:", crashStack);
    await logError("story_general_error", `generate-story crash: ${crashMessage}`, { stack: crashStack?.substring(0, 1500) });
    const userMessage = error instanceof Error && error.message.startsWith("שגיאה")
      ? error.message
      : "שגיאה בעיבוד הבקשה. נסו שוב מאוחר יותר.";
    return new Response(
      JSON.stringify({ error: userMessage, debug: crashMessage.substring(0, 300) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
