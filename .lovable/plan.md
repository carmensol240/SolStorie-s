## מטרה
לאחד את `characterProfile` + `storyOutfit` בין `generate-cover` ל-`generate-illustrations`, כך שהדמות בכריכה תלבש את אותו לבוש ותיראה זהה לדמות בעמודי הסיפור.

## המצב היום
- **generate-illustrations** מחלץ `characterProfile` (מגדר/גיל/שיער/עור/עיניים/בגדים) מתמונת הילד ושומר אותו ב-`children.avatar_description` כ-JSON. בנוסף הוא קובע `storyOutfit` אחיד לכל הסיפור = `adventureLogic.outfit || characterProfile.clothingDescription || "colorful casual clothes"`.
- **generate-cover** קורא את `children.avatar_description` ובונה תיאור דמות משלו (`buildCharacterDescription`), אבל לוקח את הבגדים מתוך `clothingDescription` של הפרופיל — **לא** משתמש ב-`storyOutfit` של הסיפור. לכן הלבוש בכריכה שונה מהעמודים הפנימיים.
- שתי הפונקציות רצות במקביל מ-`generate-story`, אז ייתכן ש-`avatar_description` עדיין לא נשמר ל-DB כשהכריכה רצה (race condition קיים גם היום).

## השינוי המוצע

### קבצים שישתנו
1. **`supabase/functions/generate-cover/index.ts`**
   - לקבל `adventureLogic` ב-body של הבקשה.
   - לחשב `storyOutfit` בדיוק כמו ב-illustrations: `adventureLogic?.outfit || profile.clothingDescription || "colorful casual clothes"`.
   - להעביר את `storyOutfit` ל-`buildCharacterDescription` ולהשתמש בו במקום `clothing` שמגיע מ-`clothingDescription`.
   - להשתמש באותה ניסוח של מגבלות מגדר כמו ב-illustrations (כבר דומה — להאחיד).

2. **`supabase/functions/generate-story/index.ts`** (שורות ~2122-2133)
   - להוסיף `adventureLogic` ל-body שנשלח ל-`generate-cover`.

### קבצים שלא ישתנו
- `src/pages/StoryViewer.tsx` ו-`src/pages/Library.tsx` (regenerate cover) — לא נעביר `adventureLogic` כי הוא לא נשמר ב-DB. במקרה הזה הכריכה תיפול חזרה ל-`clothingDescription` מהפרופיל השמור — בדיוק כמו היום.
- `_shared/style-config.ts`, `generate-illustrations`, `retry-illustration` — ללא שינוי.

## סיכונים
1. **Race condition (קיים כבר היום, לא חדש):** הכריכה רצה במקביל ל-illustrations. אם generate-illustrations עוד לא הספיק לשמור את `characterProfile` ל-`avatar_description`, הכריכה תשתמש בברירות מחדל לתיאור הדמות (שיער/עור/עיניים). העברת `adventureLogic.outfit` פותרת לפחות את חלק הלבוש מיד.
2. **כריכה שונה לרגנרציה:** אם משתמש מחדש כריכה מ-StoryViewer/Library — אין `adventureLogic` בידיים, אז הלבוש יהיה זה ששמור ב-`avatar_description.clothingDescription`. זה עשוי להיות שונה מהלבוש בעמודי הסיפור עצמם (כי שם נעשה fallback של `adventureLogic.outfit`). פתרון אפשרי בעתיד: לשמור את `story_outfit` בטבלת `stories`.
3. **שינוי תיאור דמות לכריכות חדשות:** סיפורים חדשים יקבלו כריכה עם לבוש שונה ממה שהיה מתקבל עד היום (יותר נכון — תואם לעמודי הסיפור).

## השפעה על סיפורים קיימים
- **אפס השפעה אוטומטית.** ה-`cover_url` של סיפורים קיימים כבר שמור ב-DB; הוא לא ייווצר מחדש אלא אם המשתמש לוחץ "חדש כריכה".
- בסיפורים חדשים: הכריכה תהיה תואמת יותר לעמודים הפנימיים.
- ברגנרציה ידנית של כריכה לסיפור קיים: הלבוש יילקח מ-`avatar_description.clothingDescription` (התנהגות זהה לעצם בקריאה ישירה כיום).
