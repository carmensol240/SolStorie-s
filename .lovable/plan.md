

## חזרה לאיורים באיכות גבוהה — החלפת Flux Kontext ב-Gemini Image Generation

### אבחון הבעיה

ניתחתי את הקוד ואת צילומי המסך של הגרסה הישנה. הבעיה המרכזית:

**Flux Kontext הוא מודל עריכת תמונה (image-to-image editing), לא מודל יצירה מטקסט.** הוא מקבל תמונת ייחוס ומנסה "לערוך" אותה — מה שמוביל לאיורים חוזרים וגנריים ללא קשר לטקסט. זו הסיבה שכל האיורים נראים דומים.

הגרסה הישנה (בצילומי המסך) יצרה איורים ב-Pixar 3D CGI מושלמים עם קשר ברור לטקסט — כל סצנה שונה (חדר רופא שיניים, כיסא הטיפול, מראה קטנה). זה אפשרי רק עם מודל text-to-image אמיתי.

### פתרון — החלפת Flux Kontext ב-Gemini Image Generation

הפונקציה `generate-cover` כבר משתמשת ב-`google/gemini-3-pro-image-preview` עם תמונות ייחוס ומייצרת איורים מעולים. נשתמש באותה גישה בדיוק עבור איורי הסיפור.

### שינויים

**`supabase/functions/generate-illustrations/index.ts`:**

1. **החלפת `generateIllustrationWithFace`**: במקום Flux Kontext, הפונקציה תשתמש ב-Gemini Image Generation (`google/gemini-3-pro-image-preview`) עם תמונת הילד כ-reference image. הפרומפט ידגיש את תיאור הסצנה (מה-`illustration_prompt`) ולא את סגנון הדמות.

2. **מבנה הבקשה החדש** (כמו בפונקציית הכריכה):
```
messages: [{
  role: "user",
  content: [
    { type: "image_url", image_url: { url: childPhoto } },  // face reference
    { type: "text", text: "FACE REFERENCE: render as Pixar 3D version. SCENE: ${illustrationPrompt}" }
  ]
}],
modalities: ["image", "text"]
```

3. **Flux Schnell נשאר כ-fallback**: אם Gemini נכשל (rate limit, timeout), נפול ל-Schnell כמו היום.

4. **הסרת FAL_KEY dependency** מהנתיב הראשי: הנתיב עם תמונת ילד ישתמש ב-LOVABLE_API_KEY (Gemini), לא ב-FAL_KEY. FAL_KEY ישמש רק ל-Schnell fallback.

**`supabase/functions/retry-illustration/index.ts`:**

אותו שינוי — החלפת Flux Kontext ב-Gemini Image Generation עם תמונת ייחוס.

### למה זה יעבוד

- Gemini Image Generation הוא מודל text-to-image אמיתי שמבין סצנות מורכבות
- הוא מקבל תמונת ייחוס ויודע לשמור על דמיון פנים תוך יצירת סצנות שונות לחלוטין
- פונקציית הכריכה כבר מוכיחה שזה עובד מצוין עם אותו סגנון Pixar 3D
- הפרומפט יהיה ממוקד בסצנה (מה הדמות עושה, איפה, מה קורה) — בדיוק כמו בגרסה הישנה

### תוצאה צפויה

- כל איור ייצור סצנה ייחודית שתואמת את הטקסט של אותו דף
- הדמות תישמר עקבית (פנים, שיער, גוון עור) בזכות תמונת הייחוס
- סגנון Pixar 3D CGI כמו בצילומי המסך מהגרסה הישנה

