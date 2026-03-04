

## תוכנית: פרומפטים ייחודיים לכל עמוד באמצעות ניתוח AI

### הבעיה
כל האיורים נראים זהים כי הפרומפט הוא בעיקר בלוק סטטי ענק (סגנון + דמויות + negative) עם רק שורת `SCENE: ${prompt}` קטנה שמשתנה. המודל "טובע" בהנחיות הקבועות ומתעלם מהסצנה הספציפית.

### הפתרון
הוספת שלב AI (Gemini Flash) שמנתח את טקסט כל עמוד ומייצר תיאור סצנה עשיר וייחודי **לפני** שליחת הפרומפט ל-Fal.ai.

### שינויים — קובץ אחד בלבד
`supabase/functions/generate-illustrations/index.ts`

#### 1. פונקציה חדשה: `analyzePageScene()`
- מקבלת: טקסט העמוד, מספר עמוד, סה"כ עמודים, נושא הסיפור
- שולחת ל-Gemini Flash (דרך Lovable Gateway) בקשת tool-calling שמחזירה JSON מובנה:
```json
{
  "scene_action": "running through a magical forest chasing a glowing butterfly",
  "environment": "dense enchanted forest with giant mushrooms and fireflies",
  "camera_angle": "low angle shot looking up",
  "lighting": "dappled golden sunlight filtering through leaves",
  "mood": "adventurous and curious",
  "character_action": "reaching out with one hand toward a butterfly"
}
```
- רוטציה מובנית של זוויות מצלמה: מערך קבוע של 6 זוויות, כל עמוד מקבל זווית שונה לפי page_number % 6
- fallback: אם הניתוח נכשל, חוזר ל-illustration_prompt המקורי

#### 2. עדכון `buildScenePrompt()` — פונקציה חדשה
מרכיבה את הפרומפט הסופי מהחלקים:
```
"[character description], [specific action from AI], [detailed environment from AI], [camera angle], [lighting], [mood], children's book illustration style, Pixar 3D animation"
```
הסגנון הקבוע (Pixar/Disney) נשאר אך מקוצר — עובר לסוף הפרומפט במקום לתפוס את תחילתו.

#### 3. עדכון הלולאה הראשית (שורות 696-768)
- לפני כל קריאה ל-`generateIllustrationWithFace` / `generateIllustration`, קריאה ל-`analyzePageScene()` עם `page.text`
- הפרומפט שנשלח ל-Fal משתנה מ-`page.illustration_prompt` לפרומפט העשיר שנבנה מהניתוח

#### 4. ללא שינוי ב-timeout/retry
הניתוח ב-Gemini Flash לוקח ~1-2 שניות לעמוד. הלולאה כבר סדרתית אז זה מוסיף ~10 שניות לסיפור שלם.

### מבנה הפרומפט החדש (דוגמה)
```text
A girl aged 4 with long brown hair and olive skin, 
reaching out excitedly toward a glowing butterfly, 
in a dense enchanted forest with giant mushrooms and fireflies at ground level, 
low angle shot looking up at the character, 
dappled golden sunlight filtering through canopy leaves, 
adventurous and curious mood, 
3D Disney Pixar cartoon style, vibrant colors, full body head to toe
```

### מה לא משתנה
- קוד צד-לקוח
- מסד נתונים
- retry-illustration / generate-cover (אפשר להרחיב בהמשך)
- לוגיקת upload, retry, character profile

