## חלק 1 — בעיית כריכת הסיפור (הסבר בלבד, ללא שינויים)

**איך נוצרת הכריכה היום** (`supabase/functions/generate-cover/index.ts`):

1. שולפים את הסיפור (gender, age, child_name, user_id) ואת רשומת הילד מ-`children` כדי לקבל:
   - `avatar_url` — רנדור Pixar מוכן מראש של פני הילד (ה"אווטאר")
   - `photo_url` — תמונת המקור של הילד
   - `avatar_description` — תיאור טקסטואלי של המראה
2. בוחרים תמונת ייחוס (`faceUrl`): מעדיפים `avatar_url`, ואם אין — `photo_url`.
3. בוחרים "סצנת ייחוס" = העמוד עם ה-`illustration_prompt` הארוך ביותר (שורות 263–280). 600 התווים הראשונים שלו נכנסים לפרומפט תחת `SCENE: ...`.
4. בונים `characterDescription` ע"י `buildCharacterDescription(avatarDescription, gender, age_range)` ושולחים ל-`google/gemini-3-pro-image-preview` יחד עם `faceUrl` כתמונת ייחוס.

**למה הכריכה לא תואמת לדמות שבעמודי הסיפור — שלושה גורמים נפרדים, מצטברים:**

1. **שני "מקורות אמת" שונים לדמות.**
   - הכריכה משתמשת ב-`characterDescription` הבנוי מ-`avatar_description` של הילד (שמאוחסן ב-`children`).
   - העמודים הפנימיים (`generate-illustrations` שורות 1199–1201) בונים `charDesc` מ-`characterProfile` (gender / ageDescription / hairDescription / skinTone / eyeColor / storyOutfit) שמחושב ב-runtime מתוך הסיפור — שדות שונים לגמרי. תוצאה: שיער/עור/בגדים יכולים לצאת שונים בין כריכה לעמודים.

2. **בגדים (outfit) של הדמות הפנימית לא נשלחים לכריכה.**
   - בעמודים הפנימיים יש `storyOutfit` קבוע לכל הסיפור.
   - בכריכה אין כלל אזכור ל-`storyOutfit`. הדגם מקבל רק את `avatar_description` הכללי + תיאור הסצנה. לכן הכריכה כמעט תמיד תציג בגדים שונים מהסיפור.

3. **תמונת הייחוס לפנים שונה.**
   - הכריכה מעדיפה `avatar_url` (רנדר Pixar מוכן).
   - העמודים הפנימיים (`generate-illustrations` שורות 1180–1188) משתמשים ב-`childPhotoSignedUrl` של תמונת המקור (`child-photos` bucket). כשהאווטאר נוצר עם וריאציות מסוימות הפנים יוצאות שונות מאשר רנדר ישירות מהתצלום, וזה מתחזק כשהפרומפטים בעצמם שונים.

**שורה תחתונה:** הכריכה לא "שוברת" את הזהות במכוון — אבל היא בנויה מצינור שונה לגמרי מהעמודים (תיאור דמות שונה, מקור פנים שונה, אין בגדים, סצנה = הפרומפט הארוך ביותר ולא בהכרח המייצג). פתרון אמיתי ידרוש לאחד את `characterProfile`/`storyOutfit` בין שתי הפונקציות — לא נוגעים בזה כעת.

---

## חלק 2 — תוכנית חיזוק התאמה טקסט↔תמונה (שלבים 1–4 בלבד)

**קבצים מותרים לעריכה (שני בלבד):**
- `supabase/functions/generate-illustrations/index.ts`
- `supabase/functions/retry-illustration/index.ts`

לא נוגעים ב-`generate-cover/index.ts`, ב-`_shared/style-config.ts`, ולא ב-`generate-story/index.ts`.

### שלב 1 — `generate-illustrations` עמוד ראשי (שורות 1195–1203)

הוספת `page.text` לפרומפט והגדלת משקל ה-SCENE. במקום:
```ts
const basePrompt = page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
...
let illustrationPrompt = `${charDesc}. SCENE: ${basePrompt}. CAMERA: ...`;
```
ל:
```ts
const basePrompt = page.illustration_prompt || `A cheerful children's book illustration for page ${page.page_number}`;
const pageNarrative = (page.text || "").toString().slice(0, 400);
const sceneBlock = pageNarrative
  ? `SCENE (MUST MATCH THE STORY TEXT EXACTLY — illustrate precisely what happens in this page, not a different action):
STORY TEXT FOR THIS PAGE: "${pageNarrative}"
VISUAL DESCRIPTION: ${basePrompt}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above. Do not invent a different scene.`
  : `SCENE (MUST MATCH TEXT EXACTLY): ${basePrompt}`;

let illustrationPrompt = `${charDesc}. ${sceneBlock}. CAMERA: ${cameraAngle}. LIGHTING: ${lighting}. Pixar 3D CGI style, vibrant colors, fantasy children's book, full body head to toe with feet grounded on surface`;
```

### שלב 2 — `generate-illustrations` עמוד שני בפריסה (שורות 1306–1314, `illustration_prompt_2`)

אותו טיפול בדיוק: לבנות `sceneBlock2` באותה תבנית עם אותו `pageNarrative` (טקסט העמוד זהה), ולשלב במקום `SCENE: ${secondPrompt}`.

### שלב 3 — `retry-illustration` ענף Gemini עם פנים (שורות 135–155)

לקרוא את `page.text` (כבר נטען ב-`select("*")` בשורה 76), לקצץ ל-400 תווים, ולהחליף את בלוק ה-SCENE הקיים בבלוק המחוזק:
```
SCENE (MUST MATCH THE STORY TEXT EXACTLY):
STORY TEXT FOR THIS PAGE: "${pageNarrative}"
VISUAL DESCRIPTION: ${prompt}
The action, objects, characters, and emotions shown MUST come from the STORY TEXT above.
```
חשוב: אם `customPrompt` נשלח — לא לדרוס אותו אלא לשלב אותו תחת `VISUAL DESCRIPTION` ולהשאיר את `STORY TEXT` כעוגן.

### שלב 4 — `retry-illustration` ענף Schnell (שורה 216)

אותו טיפול בדיוק על השרשור של `fullPrompt`. שורה אחת משתנה — החלפת `SCENE: ${prompt}` ב-`sceneBlock` הזהה לזה של שלב 3.

---

## למה זה אמור לעבוד

- היום `analyzePageText` (שמשתמש ב-`page.text`) קיים בקוד אבל **לא נקרא** בלולאה הראשית של ההפקה (השורה 1195: `// skip AI scene analysis for speed`). הטקסט של העמוד מעולם לא מגיע לדגם התמונה — רק `illustration_prompt` הקצר, שלעיתים תמציתי מדי או לא מציין את הפעולה.
- הוספה ישירה של `page.text` כעוגן ב-prompt (ללא קריאה נוספת ל-Gemini) משאירה את הלטנציה זהה, אבל נותנת לדגם התמונה גישה לפעולה האמיתית של העמוד.
- חיזוק המילים "MUST MATCH" + הפרדה ל-`STORY TEXT` ו-`VISUAL DESCRIPTION` מעלה את משקל הסצנה מול שאר הבלוקים (character / camera / lighting / style) שתופסים היום נפח גדול בפרומפט.

## מה בכוונה לא נכלל

- שלב ב' (החזרת `analyzePageText` המלא ללולאה הראשית) — דורש latency נוסף, לא נוגעים.
- כל שינוי ב-`generate-cover` (בעיית הכריכה מחלק 1) — הסבר בלבד.
- שינוי ב-`_shared/style-config.ts`, ב-`generate-story`, או בלקוח (`StoryViewer`, `DemoLockModal`, `Upgrade`).
