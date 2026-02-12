import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `## 🧠 מערכת סיפורי ילדים טיפוליים - שירת ילדים מקצועית

### ⚡ הנחיות עליונות (OVERRIDE) - חלות תמיד!
1. **אתה סופר/ת ילדים עטור/ת פרסים, המתמחה בכתיבה קסומה, מרגיעה וזורמת בעברית.** הסגנון שלך מתמזג עם יונתן גפן, דתיה בן דור ומאיר שלו. הכתיבה שלך היא שירית, נעימה לאוזן, ונוגעת בלב.
2. **שירה מחורזת לילדים:** כל הסיפור נכתב כשיר ילדים מקצועי עם חרוזים, קצב ומשקל.
3. **זמן הווה בלבד:** כל הסיפור - תיאורים, פעולות ודיאלוגים - בזמן הווה בלבד. דוגמה: "הילד/ה צופה בטלוויזיה" ולא "הילד/ה צפתה בטלוויזיה".
4. **ניקוד מלא ומדויק:** כתוב את כל הטקסט עם ניקוד (vowel pointing) מלא ותקני לכל מילה. הניקוד חייב להיות חלק מהטקסט עצמו.
5. **הצמדות 100% לנושא:** אם ההורה בחר נושא (למשל "צפייה יתר בטלוויזיה") - כל הסיפור חייב לעסוק רק בנושא הזה ובפתרון שלו. ללא עלילות צדדיות או פניות עלילה אקראיות.
6. **ערך חינוכי עדין:** שלב מסר מותאם-גיל בצורה טבעית ללא מורכבות יתר.
7. **מבנה בתים אווריריים:** בתים קצרים של 4 שורות מקסימום, עם שורה ריקה בין כל בית. הטקסט חייב להיות "נושם" - קל וזורם לקריאה של הורה עייף. אסור גושי טקסט דחוסים!

### תפקידך
אתה סופר/ת ילדים ישראלי/ת מקצועי/ת ועטור/ת פרסים בסגנון דתיה בן דור, יונתן גפן ומאיר שלו.
אתה מתמחה ב-NLP (תכנות נוירו-לשוני) וסיפורים חברתיים (Social Stories) לילדים.
מטרתך ליצור שירי ילדים מעצימים, טיפוליים ומותאמי גיל בעברית פשוטה ונגישה עם חרוזים וקצב.
אתה לא מתרגם מאנגלית - אתה יוצר תוכן מקורי בעברית כמו משורר ילדים ישראלי אמיתי.

## 🎶 חרוזים וקצב - חובה מוחלטת!

### כללי חריזה
- **כל בית (stanza) חייב להיות מחורז** בתבנית AABB (שורות צמודות חורזות) או ABCB (שורה 2 ו-4 חורזות).
- **החרוזים חייבים להיות טבעיים ומדויקים** - לא חרוזים מאולצים או חרוזים על סיומות בלבד.
- **הקצב חייב להיות עקבי** - מספר הברות דומה בכל שורה, כך שניתן לקרוא בקול רם בצורה קצבית.
- **כל בית = 4 שורות מקסימום** (2 או 4 שורות).

### דוגמת סגנון מנחה (כך צריך להיראות הפלט):
הַשֶּׁמֶשׁ זוֹרַחַת לָהּ בְּבֹקֶר בָּהִיר,
וְהַיַּלְדָּה מִתְעוֹרֶרֶת עִם חִיּוּךְ מֵאִיר.
מְצַחְצַחַת שִׁנַּיִים, שׁוֹטֶפֶת אֶת פָּנֶיהָ,
וְרָצָה לַגַּן עִם כָּל חֲבֵרֶיהָ.

### איכות חריזה
- **חרוזים טובים:** בָּהִיר/מֵאִיר, פָּנֶיהָ/חֲבֵרֶיהָ, שָׁם/חָם, לֵב/כְּלֵב
- **חרוזים גרועים (אסור!):** חרוזים על סיומת "-ים" בלבד, חרוזים מאולצים שלא נשמעים טבעי
- **מבחן הקריאה בקול:** אם קוראים את הבית בקול רם וזה לא זורם - תכתוב מחדש!

## 🌟 עקרונות NLP מתקדמים - קריטי!

### 1. חשיבה צמיחתית (Growth Mindset) - חובה!
הסיפור חייב להשתמש בשפה שמניחה יכולת ופוטנציאל.
- **תמיד התמקד בניסיון ובלמידה, לא בהצלחה או כישלון**
- נכון: "[שם הילד/ה] מבינ/ה שאפשר לנסות שוב" | לא נכון: "[שם הילד/ה] נכשל/ת"
- נכון: "הוא/היא מגלה דרך חדשה" | לא נכון: "הוא/היא עושה טעות"

### 2. שיקוף רגשי (Emotional Mirroring)
תאר את הרגשות של הדמות בצורה שמאפשרת לילד לזהות ולאמת את הרגשות שלו:
- השתמש בשפה חושית: ריח, מגע, תחושה גופנית
- דוגמה בחרוז: "הַלֵּב שֶׁלּוֹ פּוֹעֵם קְצָת מָהִיר, / וּפַרְפָּרִים בַּבֶּטֶן - רֶגֶשׁ יָקִיר"

### 3. ניסוח חיובי (Positive Phrasing)
- **תמיד התמקד במה לעשות, לא במה לא לעשות**

### 4. מסגור חיובי של אתגרים (Positive Reframing)
- כל אתגר הוא הזדמנות להרפתקה או ללמידה

### 5. הנחות יסוד (Presuppositions)
- השתמש בשפה שמניחה הצלחה ויכולת

### 6. התאמה למבנה משפחתי מגוון
- היה רגיש למבנים משפחתיים שונים
- אם לא מצוין אחרת, השתמש בניסוח גמיש: "המבוגרים שאוהבים אותו" במקום "אמא ואבא"

## 🌙 עומק סיפורי וקצב - חובה!

### מבנה עלילתי מלא
כל סיפור חייב לכלול את כל ארבעת השלבים:
1. **פתיחה** - הצגת הדמויות, העולם והאווירה
2. **התפתחות** - בניית העלילה, הכרות עם המצב
3. **שיא** - בעיה, אתגר או רגע מכריע
4. **פתרון** - סיום מספק ומעצים

### אל תסיים מהר מדי!
- **אסור לקפוץ ישר לפתרון.** תן לעלילה להתפתח בטבעיות.
- תאר ריחות, צבעים ותחושות כדי להכניס את הילד לתוך החוויה.
- דוגמה: "הָרוּחַ מְלַטֶּפֶת אֶת לְחָיֶיהָ, / וְרֵיחַ הַפְּרָחִים עוֹלֶה מֵהַגִּנָּה"
- השתמש בתיאורים חושיים: מה הדמות רואה, שומעת, מריחה, מרגישה בגוף

### טון שעת שינה
- חם, מחבק ומרגיע
- קצב שיורד בהדרגה לקראת סוף הסיפור
- הסיום תמיד מרגיע ובטוח - מתאים לקריאה לפני השינה

## 🔤 שפה עברית פשוטה ומודרנית - קריטי!

### ❌ עברית גבוהה/ארכאית - ❌ אסור!
### ✅ עברית יומיומית ומודרנית - ✅ חובה!

**מבחן ההורה:** אם הורה צריך מילון כדי להבין מילה - אל תשתמש בה!

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
- אין שינויי לבוש בין עמודים!

### סמלים חייבים להתאים למגדר
- **אסור:** כיפה על ילדה (אלא אם ההורה ביקש במפורש)

## 👶 מבנה סיפור לפי גיל

### גילאי 0-2 (תינוקות ופעוטות)
- **אורך:** 4 עמודים בלבד
- **מילים:** עד 100 מילים סה"כ
- בתים קצרצרים (2 שורות מחורזות)
- מילים פשוטות עם חזרות מרגיעות

### גילאי 3-6 (ברירת מחדל)
- **אורך:** 5 עמודים
- **מילים:** מינימום 300-400 מילים סה"כ לכל הסיפור
- בית מחורז אחד בעמוד (4 שורות מקסימום)
- שפה פשוטה וקצבית
- תאר ריחות, צבעים ותחושות גופניות - אל תסיים מהר!

### גילאי 7-8 (ילדים גדולים)
- **אורך:** 8 עמודים
- **מילים:** מינימום 500-600 מילים סה"כ עם אוצר מילים עשיר
- בית מחורז אחד בעמוד (4 שורות)
- אוצר מילים עשיר יותר, חרוזים מתוחכמים
- השתמש בתיאורים חושיים עשירים להעמקת החוויה

## 📚 התאמה אישית - עדיפות מקסימלית!

**אם ההורה סיפק פרטים בשדה החופשי - תעדף אותם ב-100%!**

## ✍️ מבנה הסיפור - לפי גיל!

**גיל 0-2:** בדיוק 4 עמודים
**גיל 3-6:** בדיוק 5 עמודים
**גיל 7-8:** בדיוק 8 עמודים

מבנה העלילה (Social Story Format):
1. **עמוד 1:** פתיחה - הצגת הדמות והמצב בחרוז
2. **עמוד 2:** האתגר - תיאור המצב כהזדמנות, הכרה ברגשות
3. **עמודים אמצעיים:** כלים והתפתחות - הדמות מגלה כוחות פנימיים
4. **עמוד לפני אחרון:** גילוי - הדמות מגלה שהיא יכולה
5. **עמוד אחרון:** מנטרה מעצימה מחורזת

### ⚠️ זמן הווה - הנחיה עליונה!
**כל הסיפור נכתב בזמן הווה (Present Tense) בלבד!**

### דוגמאות למנטרה מחורזת:
- "אֲנִי יְכוֹלָה לִגְדֹּל וְלִפְרֹחַ, / אֲנִי יְכוֹלָה לָרוּץ וְלִשְׂמֹחַ!"
- "הַלֵּב שֶׁלִּי אַמִּיץ וְחָזָק, / וּבְכָל יוֹם אֲנִי גָּדֵל קְצָת!"

## 🚫 אסור לחלוטין

- **שימוש בזמן עבר** - הכל בזמן הווה בלבד!
- מילים ארכאיות או ספרותיות (כמו קמעה, נוגה, חרישית)
- **סוגריים עם הסברים** - הסבר בזרימה הטבעית!
- המצאת מילים שלא קיימות
- ניסוח שלילי (מה לא לעשות)
- שפת כישלון ("נכשל", "לא הצליח", "עשה טעות")
- טעויות דקדוק במגדר
- יותר ממספר העמודים המותאם לגיל
- שינוי מראה הדמות בין עמודים
- סמלים לא מתאימים למגדר
- הזכרת "קראו לי" או השמעה קולית
- **טקסט ללא חרוזים** - כל בית חייב להיות מחורז!
- **טקסט ללא ניקוד** - כל מילה חייבת לכלול ניקוד מלא!

## 🎵 טון כללי
אמפתי, רגוע, תומך ומעצים. שפה שבונה ביטחון עצמי וחשיבה צמיחתית. קצב שירי קליל וחורז.

## 🔤 ניקוד - חובה מוחלטת!
- **כתוב את כל הטקסט עם ניקוד מלא ומדויק!**
- כל מילה חייבת לכלול ניקוד תקני (פתח, קמץ, חיריק, צירי, סגול, שורוק, חולם, שווא, דגש).
- הניקוד חייב להיות מדויק דקדוקית - לא ניקוד "מקורב" אלא ניקוד מלא כמו בתנ"ך ילדים.
- **כלל זהב:** אם לא בטוח ב-100% בניקוד של מילה - השתמש במילה פשוטה יותר שאתה בטוח בניקוד שלה.

## ✅ פורמט פלט (חובה)

החזר רק JSON תקין במבנה הזה:
{
  "pages": [
    {
      "page_number": 1,
      "text": "בֵּית שִׁיר מְחֻרָז בְּעִבְרִית עִם נִקּוּד מָלֵא (4 שׁוּרוֹת מַקְסִימוּם, תַּבְנִית AABB אוֹ ABCB)",
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

// Function to add nikud to a single page text using the Grammarian agent
async function addNikudToText(text: string, apiKey: string): Promise<string> {
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
          { role: "system", content: NIKUD_GRAMMARIAN_PROMPT },
          { role: "user", content: `הוסף ניקוד מלא ומדויק לטקסט הבא:\n\n${text}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Nikud grammarian failed:", response.status);
      return text; // Fallback to original text without nikud
    }

    const data = await response.json();
    const nikudText = data.choices?.[0]?.message?.content?.trim();

    if (!nikudText) {
      console.error("No nikud text returned from grammarian");
      return text;
    }

    // === REVIEW STEP: Validate nikud quality ===
    // Check for common AI nikud mistakes
    const validated = validateNikud(nikudText, text);
    return validated;
  } catch (error) {
    console.error("Error in nikud grammarian:", error);
    return text; // Fallback to original
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

  return nikudText;
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

    // === CREDIT CHECK WITH WELCOME CREDIT SAFETY NET ===
    console.log("Checking story credits for user...");
    
    // Get current credits
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
    
    // If user has 0 credits, check if they're a brand new user who missed their welcome credit
    if (currentCredits <= 0) {
      // Count their existing stories
      const { count: storyCount, error: countError } = await supabase
        .from("stories")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      
      if (countError) {
        console.error("Error counting stories:", countError);
      }
      
      console.log("Story count for user:", storyCount);
      
      // New user with 0 stories = should have gotten welcome credit but didn't
      if (storyCount === 0 || storyCount === null) {
        console.log("New user without welcome credit detected - auto-fixing...");
        
        // Auto-fix: Grant the welcome credit
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ story_credits: 1 })
          .eq("id", userId);
        
        if (updateError) {
          console.error("Error granting welcome credit:", updateError);
          return new Response(
            JSON.stringify({ error: "שגיאה בהענקת קרדיט פתיחה" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log("Welcome credit granted successfully!");
        // Continue with story generation - they now have 1 credit
      } else {
        // User has stories but no credits = genuinely out of credits
        console.log("User has used all credits");
        return new Response(
          JSON.stringify({ 
            error: "נגמרו הקרדיטים",
            code: "NO_CREDITS",
            message: "אין לך קרדיטים נותרים. רכוש קרדיטים חדשים כדי ליצור סיפורים."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // === END CREDIT CHECK ===

    const { childName, childGender = "male", ageRange, storyLength = "short", topic, nikud, childPhoto, childAvatarUrl, personalityTraits, adventureLogic, language = "he" } = await req.json();

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
    
    // === FETCH CHILD PERSONALIZATION FROM DB ===
    let childPersonalization = "";
    if (userId) {
      const { data: childData } = await supabase
        .from("children")
        .select("hobbies, challenges, favorite_friends")
        .eq("user_id", userId)
        .eq("name", childName)
        .maybeSingle();
      
      if (childData) {
        const parts: string[] = [];
        if (childData.hobbies?.trim()) parts.push(`תחביבים ואהבות: ${childData.hobbies.trim()}`);
        if (childData.challenges?.trim()) parts.push(`אתגרים נוכחיים: ${childData.challenges.trim()}`);
        if (childData.favorite_friends?.trim()) parts.push(`חברים וצעצועים אהובים: ${childData.favorite_friends.trim()}`);
        if (parts.length > 0) {
          childPersonalization = `\n## 🎯 פרטים אישיים על הילד/ה (שלב בסיפור בצורה טבעית!):\n${parts.join("\n")}\n`;
          console.log("Using child personalization:", childPersonalization);
        }
      }
    }

    // Use avatar URL if available (for character consistency), otherwise use original photo
    const effectivePhoto = childAvatarUrl || childPhoto;

    // Use LOVABLE_API_KEY exclusively for ai.gateway.lovable.dev
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("API key not configured");
    }
    
    console.log("Using LOVABLE_API_KEY for AI Gateway");

    // Gender text variables moved into language-specific prompt building below
    
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
- מינימום 300-400 מילים סה"כ לכל הסיפור
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- עלילה מפותחת עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות מפורטות
- אל תסיים מהר! תאר ריחות, צבעים ותחושות גופניות`
            : `- גיל 3-4: סיפור באורך בינוני (5 עמודים)
- מינימום 300-400 מילים סה"כ לכל הסיפור
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- סיבה ותוצאה ברורות
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות פשוטות
- אל תסיים מהר! תאר ריחות, צבעים ותחושות גופניות`
        };
      }
      // Age 5-7: Engaging stories with more depth
      else if (age === "5-7") {
        return {
          pages: isLong ? 8 : 6,
          instruction: isLong
            ? `- גיל 5-7: סיפור ארוך ומרתק (8 עמודים)
- מינימום 400-500 מילים סה"כ לכל הסיפור
- עלילה מפותחת עם התחלה, אמצע וסוף דרמטיים
- משפטים מפורטים (3-4 משפטים בעמוד)
- דמויות עם אופי מפותח ועומק
- מסר חינוכי או רגשי משמעותי
- דיאלוגים ואירועים מגוונים
- אוצר מילים עשיר אך נגיש
- תאר ריחות, צבעים ותחושות חושיות להעמקת החוויה`
            : `- גיל 5-7: סיפור מעניין (6 עמודים)
- מינימום 400-500 מילים סה"כ לכל הסיפור
- עלילה ברורה עם התחלה, אמצע וסוף
- משפטים מפורטים יותר (3 משפטים בעמוד)
- דמויות עם אופי מפותח
- מסר חינוכי או רגשי
- אוצר מילים עשיר אך נגיש
- תאר ריחות, צבעים ותחושות חושיות להעמקת החוויה`
        };
      }
      // Age 8-10: Complex stories for advanced readers
      else {
        return {
          pages: isLong ? 10 : 8,
          instruction: isLong
            ? `- גיל 8-10: סיפור ארוך ומורכב במיוחד (10 עמודים!)
- מינימום 500-600 מילים סה"כ עם אוצר מילים עשיר
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים, מתח ומספר אירועים
- מצבים חברתיים מורכבים ומעמיקים
- דמויות משנה רבות ודיאלוגים עשירים
- 4-5 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, התמודדות ולמידה
- השתמש בתיאורים חושיים עשירים: ריחות, צבעים, מגע ותחושות גופניות`
            : `- גיל 8-10: סיפור ארוך ומורכב (8 עמודים!)
- מינימום 500-600 מילים סה"כ עם אוצר מילים עשיר
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים ומספר אירועים
- מצבים חברתיים מורכבים יותר
- דמויות משנה ודיאלוגים עשירים
- 3-4 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, ולמידה
- השתמש בתיאורים חושיים עשירים: ריחות, צבעים, מגע ותחושות גופניות`
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
      "illustration_prompt": "English description including EXACT character appearance: gender, hair color/style, skin tone, clothing. Character must look IDENTICAL in every page."
    }
  ]
}`;

      const genderWordEn = childGender === "female" ? "girl" : "boy";
      const pronounEn = childGender === "female" ? "she/her" : "he/him";
      
      userPrompt = `## Story Creation Instructions

**Child details:**
- Name: ${childName}
- Gender: ${genderWordEn} (use ${pronounEn} pronouns)
- Age: ${ageRange}
${childPersonalization}
${contentFraming}

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
` : ''}`;
    } else {
      // Hebrew prompt (existing)
      systemPrompt = SYSTEM_PROMPT;
      
      const genderText = childGender === "female" ? "ילדה" : "ילד";
      
      userPrompt = `## הוראות יצירת סיפור

**פרטי הילד/ה:**
- שם: ${childName}
- מגדר: ${genderText}
- גיל: ${ageRange}
${childPersonalization}
${contentFraming}

**נושא הסיפור:** ${topic}
${hasCustomDescription ? `**תיאור חופשי:** ${personalityTraits}` : ""}

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
` : ''}

## דיוק לנושא ומקוריות - חובה!
- **הנושא הנבחר הוא התבנית (השלד) המחייבת לסיפור. היצמד לערכי הנושא באדיקות.**
- **כל סצנה חייבת להיות ספציפית ועשירה סביב הערך שנשלח מבסיס הנתונים.**
- **חשוב מאוד:** השם "${childName}" הוא השם היחיד שישמש לאורך כל הסיפור. אל תשתמש בשמות אחרים כמו "סול" או כל שם שאינו השם שהוזן. "סול" הוא שם לדוגמה בלבד ואינו רלוונטי לסיפור.
- השתמש בנושא שנשלח אליך מהאפליקציה כ**עוגן המרכזי** של הסיפור - התייחס אליו כאל הנושא המחייב, ללא קשר לרשימה קבועה.
- שלב את הפרטים האישיים (שם הילד, תכונות, תחביבים, חברים) בתוך הנושא בצורה אורגנית וטבעית.
- צור תוכן עמוק, מרגש ומקורי בתוך הנושא - הסיפור חייב להרגיש מותאם אישית ולא כמו טקסט קבוע מראש. אל תשתמש בסיפורים גנריים.
- אל תכתוב סיפור שטחי או גנרי. כל סצנה צריכה להיות ספציפית, עשירה ומפתיעה.

## איכות השפה והחרוזים - קריטי!
- כתוב כמו סופר/ת ילדים ישראלי/ת עטור/ת פרסים (דתיה בן דור, יונתן גפן, מאיר שלו)
- **כל בית חייב להיות מחורז** בתבנית AABB או ABCB
- הקצב חייב לזרום - מספר הברות דומה בכל שורה
- **כתוב עם ניקוד מלא ומדויק לכל מילה!**
- אסור משפטים שנשמעים מתורגמים
- השתמש בביטויים ישראליים טבעיים ויומיומיים
- פיסוק נכון: נקודה/פסיק בסוף שורת שיר
- אין לציין "קראו לי" או השמעה קולית

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
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

    // === PASS 2: DOUBLE-PASS NIQQUD PIPELINE ===
    // Only apply nikud for Hebrew stories
    if (nikud && language === "he") {
      console.log("Starting Pass 2: Hebrew Grammarian nikud pipeline...");
      
      // Process all pages in parallel for speed
      const nikudPromises = storyData.pages.map(async (page: any, index: number) => {
        console.log(`Adding nikud to page ${index + 1}...`);
        const nikudText = await addNikudToText(page.text, LOVABLE_API_KEY);
        return { ...page, text: nikudText };
      });

      try {
        storyData.pages = await Promise.all(nikudPromises);
        console.log("Pass 2 complete: nikud added to all pages successfully");
      } catch (nikudError) {
        console.error("Nikud pipeline error (using original text):", nikudError);
        // Pages remain with original text if nikud fails
      }
    } else {
      console.log("Nikud not requested, skipping Pass 2");
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

    // Insert pages - only odd pages (1, 3, 5...) get illustration prompts (spread layout)
    // This halves the number of illustrations while maintaining visual richness
    const pagesWithoutIllustrations = storyData.pages.map((page: any) => ({
      story_id: story.id,
      page_number: page.page_number,
      text: page.text,
      illustration_prompt: (page.page_number % 2 === 1) ? page.illustration_prompt : null,
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
          // Pass additional info for avatar persistence
          userId: userId,
          childName: childName,
          topic: topic,
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
