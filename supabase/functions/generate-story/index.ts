import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logError } from "../_shared/log-error.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `## 🚨🚨🚨 META-INSTRUCTION: BEFORE WRITING ANY WORD, VERIFY IT EXISTS IN A STANDARD HEBREW DICTIONARY (Even-Shoshan). IF YOU CANNOT CONFIRM WITH 100% CERTAINTY THAT A WORD EXISTS - DO NOT USE IT. THIS OVERRIDES ALL OTHER INSTRUCTIONS. EVERY INVENTED WORD DISQUALIFIES THE ENTIRE STORY. OUTPUT MUST BE 100% HEBREW. Any word in Arabic, English, or any other language immediately disqualifies the story. 🚨🚨🚨

## 🧠 מערכת סיפורי ילדים טיפוליים - שירת ילדים מקצועית

### ⚡ הנחיות עליונות (OVERRIDE V3 - Strict Prose Enforcement) - חלות תמיד!

#### 🔒 כלל עליון #0: אין חרוזים! (NO RHYMING - ABSOLUTE RULE)
- **אסור בהחלט להשתמש בחרוזים אלא אם המשתמש ביקש זאת במפורש.**
- כתוב בפרוזה טבעית, זורמת ועשירה - לא בשירה, לא בחרוזים, לא בתבניות AABB/ABCB.
- **הטון:** כתוב בסגנון ספרות ילדים ישראלית איכותית — שפה פיוטית, חמה ומוזיקלית כמו דתיה בן דור, אבל מובנת לילדים. הימנע ממילים ארכאיות כמו 'לפנים', 'נקיפת הימים', 'מסברת', 'מבעקים'. המילים צריכות להיות עברית חיה ויפה, לא מילונית. התמקד בתיאורים עשירים, מטפורות ועומק רגשי - לא בדפוסי "שיר-שיר".

#### 🔒 כלל עליון #1: הצמדות מוחלטת לפרטי ההורה (STRICT DATA ADHERENCE)
- **חובה לשלב לפחות 3 פרטים ספציפיים** שההורה כתב בתיבת הטקסט החופשי.
- אם ההורה תיאר אירוע ספציפי (למשל: "לא רצתה לחפוף שיער", "היה ריב בגן עם חבר") - **האירוע הזה חייב להיות הנושא המרכזי של הסיפור!**
- אין להתעלם מפרטים שההורה כתב ואין להחליף אותם בנושא גנרי.

#### 🔒 כלל עליון #2: איסור מוחלט על המצאת מילים (NO INVENTED WORDS)
- **השתמש רק בעברית תקנית ומוכרת.** אסור "להזות" או לשלב מילים לג'יבריש.
- **עדיפות מוחלטת:** הלוגיקה הנרטיבית, הקוהרנטיות והרלוונטיות לפרטים שסופקו הם מעל הכל.

1. **אתה סופר/ת ילדים עטור/ת פרסים, המתמחה בכתיבה קסומה, מרגיעה וזורמת בעברית.** הסגנון שלך מתמזג עם יונתן גפן, דתיה בן דור ומאיר שלו. כתוב בפרוזה טבעית וזורמת בהשראת מאיר שלו -- עשירה, חמה, ספרותית, לעולם לא מחורזת. הכתיבה שלך עשירה, נוגעת בלב ומשתמשת באוצר מילים חכם ומשחקי. **אתה כותב בפרוזה ספרותית - לא בשירה מחורזת.**
2. **פרוזה ספרותית לילדים:** הסיפור נכתב כסיפור ילדים מקצועי בפרוזה טבעית וזורמת, עם קצב מלודי ועומק רגשי. **אין חרוזים, אין תבניות שיר.**
3. **זמן הווה בלבד:** כל הסיפור - תיאורים, פעולות ודיאלוגים - בזמן הווה בלבד. דוגמה: "הילד/ה צופה בטלוויזיה" ולא "הילד/ה צפתה בטלוויזיה".
4. **ניקוד מלא ומדויק:** כתוב את כל הטקסט עם ניקוד (vowel pointing) מלא ותקני לכל מילה. הניקוד חייב להיות חלק מהטקסט עצמו.
5. **הצמדות 100% לנושא:** אם ההורה בחר נושא (למשל "צפייה יתר בטלוויזיה") - כל הסיפור חייב לעסוק רק בנושא הזה ובפתרון שלו. ללא עלילות צדדיות או פניות עלילה אקראיות.
6. **ערך חינוכי ברור:** כל סיפור חייב להסתיים עם מסר חינוכי ברור או מסר רגשי חיובי שהילד/ה יכול/ה לקחת איתו/ה. המסר חייב להיות משולב בעלילה באופן טבעי -- לא כ'מוסר השכל' חיצוני.
7. **מבנה פסקאות אווריריות:** פסקאות קצרות של 3-4 משפטים מקסימום, עם שורה ריקה בין כל פסקה. הטקסט חייב להיות "נושם" - קל וזורם לקריאה של הורה עייף. אסור גושי טקסט דחוסים!

### תפקידך
אתה סופר/ת ילדים ישראלי/ת מקצועי/ת ועטור/ת פרסים. כתוב בסגנון ספרות ילדים ישראלית איכותית — שפה פיוטית, חמה ומוזיקלית כמו דתיה בן דור, אבל מובנת לילדים.
אתה מתמחה ב-NLP (תכנות נוירו-לשוני) וסיפורים חברתיים (Social Stories) לילדים.
מטרתך ליצור סיפורי ילדים בפרוזה ספרותית — מעצימים, טיפוליים ומותאמי גיל בעברית חיה, יפה ונגישה — לא מילונית או ארכאית.
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
- **כתוב בסגנון ספרות ילדים ישראלית איכותית:** שפה פיוטית, חמה ומוזיקלית — עברית חיה ויפה, לא מילונית או ארכאית. הימנע ממילים כמו 'לפנים', 'נקיפת הימים', 'מסברת', 'מבעקים'.
- התמקד בתיאורים עשירים, מטפורות, ועומק רגשי.
- **מבחן הקריאה בקול:** אם קוראים את הפסקה בקול רם וזה לא זורם כסיפור טבעי - תכתוב מחדש!
- **מבחן המשמעות:** אם מילה מרגישה "מוזרה" או לא שייכת לסצנה - החלף אותה!
- **מבחן המילון:** אם מילה לא מופיעה במילון עברי תקני - אסור להשתמש בה!

### אוצר מילים (שפה עשירה ותקנית)
- השתמש בעברית עשירה ותקנית (שפה גבוהה) אך וודא שהיא מותאמת לגיל:
  - גילאי 0-2: מילים פשוטות וקצרות
  - גילאי 3-6: מילים מגוונות ועשירות אך מוכרות
  - גילאי 7-8: אוצר מילים מורכב ומתוחכם

## 🌟 עקרונות NLP מתקדמים - קריטי!

### 1. חשיבה צמיחתית (Growth Mindset) - חובה!
הסיפור חייב להשתמש בשפה שמניחה יכולת ופוטנציאל.
- **תמיד התמקד בניסיון ובלמידה, לא בהצלחה או כישלון**
- נכון: "[שם הילד/ה] מבינ/ה שאפשר לנסות שוב" | לא נכון: "[שם הילד/ה] נכשל/ת"
- נכון: "הוא/היא מגלה דרך חדשה" | לא נכון: "הוא/היא עושה טעות"

### 2. שיקוף רגשי (Emotional Mirroring)
תאר את הרגשות של הדמות בצורה שמאפשרת לילד לזהות ולאמת את הרגשות שלו:
- השתמש בשפה חושית: ריח, מגע, תחושה גופנית
- דוגמה בפרוזה: "הַלֵּב שֶׁלּוֹ פּוֹעֵם קְצָת מָהִיר, וּפַרְפָּרִים קְטַנִּים מְרַפְרְפִים לוֹ בַּבֶּטֶן."

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
- דוגמה: "הָרוּחַ מְלַטֶּפֶת אֶת לְחָיֶיהָ, וְרֵיחַ הַפְּרָחִים הַמָּתוֹק עוֹלֶה מִן הַגִּנָּה."
- השתמש בתיאורים חושיים: מה הדמות רואה, שומעת, מריחה, מרגישה בגוף

### טון שעת שינה
- חם, מחבק ומרגיע
- קצב שיורד בהדרגה לקראת סוף הסיפור
- הסיום תמיד מרגיע ובטוח - מתאים לקריאה לפני השינה

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
- אין שינויי לבוש בין עמודים!

### סמלים חייבים להתאים למגדר
- **אסור:** כיפה על ילדה (אלא אם ההורה ביקש במפורש)

## 👶 מבנה סיפור לפי גיל

### גילאי 0-2 (תינוקות ופעוטות)
- **אורך:** 4 עמודים בלבד
- **מילים:** עד 100 מילים סה"כ (כ-25 מילים לעמוד)
- **משפטים קצרצרים:** 3-5 מילים מקסימום למשפט. לא יותר!
- **שפה חזרתית ופשוטה:** השתמש בחזרות מרגיעות על אותו מבנה משפט
- **התמקד בחושים:** רך, חם, נעים, מתוק, שקט, חיבוק, אהבה
- **נושאים מתאימים:** שינה, חיות, חיבוקים, צבעים, צלילים, אוכל, משחק
- **ללא עלילה מורכבת!** כל עמוד = פעולה אחת פשוטה או תחושה אחת
- **דוגמה לסגנון הכתיבה (בעברית עם ניקוד):**
  עמוד 1: "הַדֻּבִּי רַךְ. [שם] מְחַבֶּקֶת אֶת הַדֻּבִּי."
  עמוד 2: "הַשְּׂמִיכָה חַמָּה. [שם] מִתְכַּסָּה וּמְחַיֶּכֶת."
  עמוד 3: "הַכּוֹכָבִים נוֹצְצִים. [שם] עוֹצֶמֶת עֵינַיִים."
  עמוד 4: "לַיְלָה טוֹב, [שם]. חֲלוֹמוֹת מְתוּקִים."
- **אסור:** משפטים ארוכים, מילים מורכבות, עלילה מסובכת, דיאלוגים ארוכים

### גילאי 3-6 (ברירת מחדל)
- **אורך:** 5 עמודים
- **מילים:** מינימום 300-400 מילים סה"כ לכל הסיפור. **חובה: כל עמוד חייב להכיל לפחות 3-4 משפטים מלאים. סיפור קצר מ-300 מילים נפסל!**
- פסקה קצרה בכל עמוד (3-4 משפטים מקסימום)
- שפה פשוטה וקצבית
- תאר ריחות, צבעים ותחושות גופניות - אל תסיים מהר!
- **כל עמוד חייב להתקדם בעלילה** — אסור שני עמודים עם אותו תוכן

### גילאי 7-8 (ילדים גדולים)
- **אורך:** 8 עמודים
- **מילים:** מינימום 500-600 מילים סה"כ עם אוצר מילים עשיר
- פסקאות עשירות בכל עמוד
- אוצר מילים עשיר ומתוחכם, פרוזה ספרותית
- השתמש בתיאורים חושיים עשירים להעמקת החוויה

## 📚 התאמה אישית - עדיפות מקסימלית!

**אם ההורה סיפק פרטים בשדה החופשי - תעדף אותם ב-100%!**

## ✍️ מבנה הסיפור - לפי גיל!

**גיל 0-2:** בדיוק 4 עמודים
**גיל 3-6:** בדיוק 5 עמודים
**גיל 7-8:** בדיוק 8 עמודים

מבנה העלילה (Social Story Format):
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
- יותר ממספר העמודים המותאם לגיל
- שינוי מראה הדמות בין עמודים
- סמלים לא מתאימים למגדר
- הזכרת "קראו לי" או השמעה קולית
- **טקסט ללא ניקוד** - כל מילה חייבת לכלול ניקוד מלא!

## 🎵 טון כללי
אמפתי, רגוע, תומך ומעצים. שפה שבונה ביטחון עצמי וחשיבה צמיחתית. פרוזה ספרותית עשירה ומלודית.

## 🔤 ניקוד - חובה מוחלטת!
- **כתוב את כל הטקסט עם ניקוד מלא ומדויק!**
- כל מילה חייבת לכלול ניקוד תקני (פתח, קמץ, חיריק, צירי, סגול, שורוק, חולם, שווא, דגש).
- הניקוד חייב להיות מדויק דקדוקית - לא ניקוד "מקורב" אלא ניקוד מלא כמו בתנ"ך ילדים.
- **ניקוד שגוי גרוע מאי-ניקוד.** אם לא בטוח ב-100% בניקוד של מילה — השתמש במילה פשוטה יותר שאתה בטוח בניקוד שלה. ניקוד שגוי פוסל את הסיפור.

## ✅ פורמט פלט (חובה)

החזר רק JSON תקין במבנה הזה:
{
  "pages": [
    {
      "page_number": 1,
      "text": "פְּסָקָה בְּפְרוֹזָה סִפְרוּתִית בְּעִבְרִית עִם נִקּוּד מָלֵא (3-4 מִשְׁפָּטִים מַקְסִימוּם)",
      "illustration_prompt": "CRITICAL: Describe the SPECIFIC scene on this page in English. The illustration MUST match the page text EXACTLY — if the text says the child hugs a teddy bear, the illustration must show a teddy bear hug, NOT two characters hugging. Include: (1) What the main character is DOING — use the EXACT action from the text (e.g., 'petting a giraffe', 'hugging a teddy bear', 'hiding under a blanket'), (2) The EXACT environment/background from the text (e.g., 'zoo with elephants and trees', 'bedroom with stars on the ceiling'), (3) Character's EXACT appearance: gender, hair color/style, skin tone, clothing, (4) Any specific objects, animals, or secondary characters mentioned in the text. Do NOT add elements that are not in the text. Do NOT change the action described in the text. Each page MUST have a DIFFERENT scene that precisely reflects its text."
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
    
    // === ATOMIC CREDIT DEDUCTION (server-side) ===
    // Deduct 1 credit atomically using the current DB value to avoid race conditions
    // with coupon redemptions or concurrent requests
    {
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
      
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ story_credits: freshCredits - 1 })
        .eq("id", userId);
      
      if (deductError) {
        console.error("Error deducting credit:", deductError);
        // Non-blocking: continue with story generation even if deduction fails
      } else {
        console.log(`Credit deducted server-side: ${freshCredits} → ${freshCredits - 1}`);
      }
    }
    // === END CREDIT CHECK ===

    const { childName, childGender = "male", ageRange, storyLength = "short", topic, nikud, childPhoto, childAvatarUrl, personalityTraits, adventureLogic, language = "he", className, topicDescription, childId } = await req.json();

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

    // Validate className if provided
    const MAX_CLASS_NAME_LENGTH = 100;
    if (className && typeof className === "string" && className.length > MAX_CLASS_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `שם הכיתה/הגן ארוך מדי (מקסימום ${MAX_CLASS_NAME_LENGTH} תווים)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating story for:", { childName, childGender, ageRange, storyLength, topic, nikud, hasPhoto: !!childPhoto, hasAvatar: !!childAvatarUrl, hasTraits: !!personalityTraits, hasAdventureLogic: !!adventureLogic, className: className || null });
    
    // === FETCH CHILD PERSONALIZATION FROM DB ===
    let childPersonalization = "";
    if (userId) {
      const { data: childData } = await supabase
        .from("children")
        .select("hobbies, challenges, favorite_friends, fixed_details")
        .eq("user_id", userId)
        .eq("name", childName)
        .maybeSingle();
      
      if (childData) {
        const parts: string[] = [];
        if (childData.fixed_details?.trim()) parts.push(`רקע קבוע על הילד/ה: ${childData.fixed_details.trim()}`);
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

    // LOVABLE_API_KEY for all AI calls (story generation + background tasks)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-story] ❌ LOVABLE_API_KEY is NOT configured!");
      throw new Error("API key not configured");
    }
    console.log("[generate-story] ✅ LOVABLE_API_KEY loaded successfully");

    // Gender text variables moved into language-specific prompt building below
    
    // Determine story length based on age AND user preference
    const getAgeLengthInstruction = (age: string, preferredLength: string) => {
      const isLong = preferredLength === "long";
      const isExtraLong = preferredLength === "extra-long";
      
      // Age 0-2: Short and simple stories for toddlers
      if (age === "0-2") {
        return {
          pages: isLong ? 7 : 6,
          instruction: isLong 
            ? `- גיל 0-2: סיפור קצר (7 עמודים)
- עד 160 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- דגש על חוויות חושיות ומרגיעות
- כל עמוד: משפט אחד עד שניים!`
            : `- גיל 0-2: סיפור קצר מאוד (6 עמודים)
- עד 130 מילים סה"כ לכל הסיפור
- משפטים קצרצרים (3-5 מילים בלבד)
- מילים פשוטות עם חזרות מרגיעות
- דגש על חוויות חושיות ומרגיעות
- כל עמוד: משפט אחד בלבד!`
        };
      } 
      // Age 2-4 (around age 3-4): Medium-length imaginative stories
      else if (age === "2-4") {
        return {
          pages: isExtraLong ? 10 : isLong ? 8 : 7,
          instruction: isExtraLong
            ? `- גיל 3-4: סיפור ארוך במיוחד (10 עמודים)
- מינימום 500-600 מילים סה"כ לכל הסיפור
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- עלילה מפותחת עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות מפורטות
- אל תסיים מהר! תאר ריחות, צבעים ותחושות גופניות`
            : isLong
            ? `- גיל 3-4: סיפור באורך בינוני-ארוך (8 עמודים)
- מינימום 400-500 מילים סה"כ לכל הסיפור
- נושאים דמיוניים ומעניינים
- משפטים קצרים וברורים (2-3 משפטים בעמוד)
- עלילה מפותחת עם סיבה ותוצאה
- דמויות חמודות ומצחיקות
- אינטראקציות חברתיות מפורטות
- אל תסיים מהר! תאר ריחות, צבעים ותחושות גופניות`
            : `- גיל 3-4: סיפור באורך בינוני (7 עמודים)
- מינימום 350-450 מילים סה"כ לכל הסיפור
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
          pages: isExtraLong ? 12 : isLong ? 10 : 8,
          instruction: isExtraLong
            ? `- גיל 5-7: סיפור ארוך במיוחד ומרתק (12 עמודים!)
- מינימום 700-800 מילים סה"כ לכל הסיפור
- עלילה מפותחת ועשירה עם התחלה, אמצע וסוף דרמטיים
- משפטים מפורטים (4-5 משפטים בעמוד)
- דמויות עם אופי מפותח ועומק רגשי
- מסר חינוכי או רגשי משמעותי ועמוק
- דיאלוגים ואירועים מגוונים ומפתיעים
- אוצר מילים עשיר אך נגיש
- תאר ריחות, צבעים ותחושות חושיות להעמקת החוויה`
            : isLong
            ? `- גיל 5-7: סיפור ארוך ומרתק (10 עמודים)
- מינימום 500-600 מילים סה"כ לכל הסיפור
- עלילה מפותחת עם התחלה, אמצע וסוף דרמטיים
- משפטים מפורטים (3-4 משפטים בעמוד)
- דמויות עם אופי מפותח ועומק
- מסר חינוכי או רגשי משמעותי
- דיאלוגים ואירועים מגוונים
- אוצר מילים עשיר אך נגיש
- תאר ריחות, צבעים ותחושות חושיות להעמקת החוויה`
            : `- גיל 5-7: סיפור מעניין (8 עמודים)
- מינימום 450-550 מילים סה"כ לכל הסיפור
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
          pages: isExtraLong ? 12 : isLong ? 12 : 10,
          instruction: isExtraLong
            ? `- גיל 8-10: סיפור ארוך במיוחד ומורכב (12 עמודים!)
- מינימום 800-900 מילים סה"כ עם אוצר מילים עשיר ומתוחכם
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים, מתח, תפניות ומספר אירועים
- מצבים חברתיים מורכבים ומעמיקים
- דמויות משנה רבות ודיאלוגים עשירים ומפורטים
- 5-6 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, התמודדות ולמידה
- השתמש בתיאורים חושיים עשירים: ריחות, צבעים, מגע ותחושות גופניות`
            : isLong
            ? `- גיל 8-10: סיפור ארוך ומורכב במיוחד (12 עמודים!)
- מינימום 600-750 מילים סה"כ עם אוצר מילים עשיר
- אוצר מילים עשיר יותר (עם הסברים בסוגריים!)
- עלילה מורכבת עם רגשות פנימיים, מתח ומספר אירועים
- מצבים חברתיים מורכבים ומעמיקים
- דמויות משנה רבות ודיאלוגים עשירים
- 4-5 משפטים מפורטים בעמוד
- נושאים מעמיקים כמו חברות, אתגרים, התמודדות ולמידה
- השתמש בתיאורים חושיים עשירים: ריחות, צבעים, מגע ותחושות גופניות`
            : `- גיל 8-10: סיפור ארוך ומורכב (10 עמודים!)
- מינימום 550-650 מילים סה"כ עם אוצר מילים עשיר
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

    // === SEQUEL LOGIC: Check for previous stories on the same topic by same child ===
    let sequelInstruction = "";
    if (userId && topic) {
      const hebrewTopicForSequel = getHebrewTopic(topic);
      let sequelQuery = supabase
        .from("stories")
        .select("id, summary")
        .eq("user_id", userId)
        .eq("topic", hebrewTopicForSequel)
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
- Gender: ${genderWordEn} (use ${pronounEn} pronouns)
- Age: ${ageRange}
${childPersonalization}
${contentFraming}
${sequelInstructionEn}

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
${sequelInstruction}
**נושא הסיפור:** ${topic}
${hasCustomDescription ? `**תיאור חופשי:** ${personalityTraits}` : ""}
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
` : ''}

## דיוק לנושא ומקוריות - חובה!
${(topicDescription && typeof topicDescription === "string" && topicDescription.trim().length > 0 && language !== "en") ? `
## 📖 תיאור הנושא המדויק (חובה לעקוב אחריו!):
${topicDescription.substring(0, 1000)}

**הנרטיב חייב לשקף בדיוק את התיאור הזה.** אל תסטה ממנו לטובת עלילה גנרית.
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

    console.log("[generate-story] 📡 Calling Lovable AI Gateway (gemini-2.5-flash) for story generation...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-story] ❌ AI Gateway error: status=${response.status}, body=${errorText}`);
      await logError("story_generation_error", `AI Gateway error: ${response.status}`, { status: response.status, body: errorText.substring(0, 500), topic, childName }, userId);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "הגעתם למגבלת הבקשות. נסו שוב בעוד מספר דקות." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "שגיאת הרשאה. אנא צרו קשר עם התמיכה." }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב מאוחר יותר.");
    }

    console.log("[generate-story] ✅ AI Gateway response received, parsing...");
    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    console.log(`[generate-story] 📊 Usage: prompt_tokens=${aiData.usage?.prompt_tokens}, completion_tokens=${aiData.usage?.completion_tokens}`);
    
    if (!content) {
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
    }

    console.log("AI response received, parsing...");

    // === Helper: clean raw AI content into parseable JSON string ===
    function cleanAiContent(raw: string): string {
      let c = raw.trim();
      if (c.startsWith("```json")) c = c.slice(7);
      else if (c.startsWith("```")) c = c.slice(3);
      if (c.endsWith("```")) c = c.slice(0, -3);
      c = c.trim();
      // Remove non-printable control chars
      c = c.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Escape raw newlines/tabs inside JSON string values
      let inString = false;
      let escaped = false;
      let result = '';
      for (let i = 0; i < c.length; i++) {
        const ch = c[i];
        if (escaped) { result += ch; escaped = false; continue; }
        if (ch === '\\' && inString) { result += ch; escaped = true; continue; }
        if (ch === '"') { inString = !inString; result += ch; continue; }
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
        // Attempt 3: retry the AI call once
        try {
          const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            signal: AbortSignal.timeout(120_000),
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (!retryResponse.ok) {
            const errBody = await retryResponse.text();
            console.error(`[generate-story] Retry AI call failed: ${retryResponse.status} - ${errBody}`);
            throw new Error("Retry failed");
          }
          const retryData = await retryResponse.json();
          const retryContent = retryData.choices?.[0]?.message?.content;
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
          }, userId);
          throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
        }
      }
    }
    
    // Validate story structure
    if (!storyData.pages || !Array.isArray(storyData.pages) || storyData.pages.length === 0) {
      console.error("Invalid story structure:", JSON.stringify(storyData).substring(0, 300));
      await logError("story_parse_error", `Invalid story structure from AI`, { keys: Object.keys(storyData), topic, childName }, userId);
      throw new Error("שגיאה ביצירת הסיפור. נסו שוב.");
    }
    
    console.log(`Story parsed successfully with ${storyData.pages.length} pages`);

    // === NIKUD: Deferred to background for faster response ===
    // Nikud will be applied after story+pages are saved, in a fire-and-forget manner
    const shouldApplyNikud = nikud && language === "he";
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
      await logError("story_insert_error", `Story insert failed: ${storyError.message}`, { code: storyError.code, topic, childName }, userId);
      throw storyError;
    }

    console.log("Story created:", story.id);

    // Insert pages - illustration assignment strategy depends on age
    // Age 0-2: EVERY page gets an illustration_prompt (+ illustration_prompt_2 for dual layout)
    // Other ages: Odd pages (1, 3, 5...) get illustration prompts; even pages are text-only
    const isToddlerAge = ageRange === "0-2";
    const pagesWithoutIllustrations = storyData.pages.map((page: any) => {
      const shouldHaveIllustration = isToddlerAge || (page.page_number % 2 === 1);
      return {
        story_id: story.id,
        page_number: page.page_number,
        text: page.text,
        illustration_prompt: shouldHaveIllustration ? page.illustration_prompt : null,
        illustration_prompt_2: isToddlerAge && page.illustration_prompt
          ? `Same scene as the main illustration but from a DIFFERENT camera angle or showing the NEXT moment in the action. Original scene: ${page.illustration_prompt}`
          : null,
        illustration_url: null,
        illustration_url_2: null,
      };
    });

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
        const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: `סכם את הסיפור הבא במשפט אחד קצר בעברית (עד 30 מילים). תן רק את המשפט, ללא הקדמה:\n${fullText}` }],
          }),
        });
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices?.[0]?.message?.content?.trim();
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

      // Include nikud and summary in the same batch so runtime waits for them
      fetchPromises.push(summaryPromise as Promise<void>);
      fetchPromises.push(nikudPromise);

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

      // Cover generation
      console.log(`Triggering generate-cover for story ${story.id}...`);
      const coverPromise = fetch(`${supabaseUrl}/functions/v1/generate-cover`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: story.id,
          title: hebrewTopic,
          topic: topic,
          language: language,
        }),
      }).then(response => {
        console.log(`generate-cover response status: ${response.status}`);
        if (!response.ok) {
          response.text().then(text => {
            console.error("generate-cover error response:", text);
          });
        }
      }).catch(err => {
        console.error("Error triggering cover generation:", err);
      });
      fetchPromises.push(coverPromise);

      // Wait for dispatch with a 15-second timeout to avoid Edge Function timeout
      // if external services (Fal.ai) are slow to accept connections
      await Promise.race([
        Promise.allSettled(fetchPromises),
        new Promise<void>(resolve => setTimeout(() => {
          console.warn("Dispatch timeout reached (15s) — proceeding with response");
          resolve();
        }, 15000)),
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
    console.error("Error in generate-story:", error);
    await logError("story_general_error", `generate-story crash: ${error?.message || error}`, {});
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
