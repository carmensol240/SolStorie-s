

## תוכנית: תיקון תמונות כפולות והחלפת תמונות שלא תואמות לסגנון

### בעיה 1: תמונות כפולות בנושאים שונים
ניתוח של `topic-data.ts` מגלה את הכפילויות הבאות:

| תמונה | נושא 1 | נושא 2 (+ 3) |
|--------|---------|---------------|
| `topicCloudAdventure` | cloud-adventure | cloud-kingdom |
| `topicMagicCastle` | magic-kingdom | dragon-party |
| `topicMagicKeys` | magic-keys | strange-inventions |
| `topicSpaceHero` | space-adventure | space-journey |
| `topicFriendship` | true-friendship | friendship-courage, play-rules-edu |
| `topicWeAreSpecial` | we-are-special | accepting-differences |
| `topicBloodTest` | blood-test | how-body-works |
| `topicSharing` | sharing | waiting-in-line-edu, politeness-edu |
| `topicAngerCloud` | anger-cloud | emotion-regulation-edu, patience-edu |
| `topicIndependence` | independence | self-confidence-edu |
| `topicEnvironment` | environment | nature-secrets |

### בעיה 2: 6 תמונות חדשות לא תואמות סגנון
התמונות שנוצרו עבור: `find-a-friend`, `screen-time`, `divorce`, `sick-grandparent`, `making-mistakes`, `crying-is-ok` — נוצרו ב-flux.schnell ולא תואמות לסגנון 3D Pixar של סול והקאסט.

### פתרון
**שלב 1:** ייצור תמונות חדשות ב-Gemini image generation (google/gemini-3-pro-image-preview) בסגנון 3D Pixar עם דמויות סול, בן והחברים — עבור:
- 6 הנושאים החדשים (find-a-friend, screen-time, divorce, sick-grandparent, making-mistakes, crying-is-ok)
- 11 נושאים כפולים שצריכים תמונה ייחודית (cloud-kingdom, dragon-party, strange-inventions, space-journey, accepting-differences, how-body-works, waiting-in-line-edu, politeness-edu, self-confidence-edu, nature-secrets, play-rules-edu — ועוד friendship-courage, emotion-regulation-edu, patience-edu)

סה"כ כ-17 תמונות חדשות.

**שלב 2:** עדכון `topic-data.ts` — החלפת ה-import/reference של כל נושא שקיבל תמונה חדשה.

### הערה טכנית
- הייצור ייעשה באמצעות Edge Function `generate-topic-images` או ישירות דרך AI gateway
- כל תמונה תיווצר בפרומפט מותאם לנושא הספציפי עם תיאור סול/בן/חברים בסגנון Pixar 3D כפי שמוגדר בזהות המותג
- התמונות יישמרו ב-`src/assets/` או ב-storage bucket `topic-images`

### מה לא משתנה
- אין שינויי DB, RLS או Edge Functions
- הנושאים עצמם (טקסטים, keywords, ageRange) נשארים כמו שהם

