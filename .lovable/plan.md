

## יצירת איור חדש לבן במסך הטעינה

### הבעיה
התמונה הנוכחית `cast-ben-art.jpg` לא תואמת את דמות בן (האח הקטן עם שיער שחור מתולתל, עור שחום, הדמות הקטנה ביותר בקאסט).

### פתרון

1. **יצירת Edge Function חד-פעמית** `generate-cast-image` שתשתמש ב-Gemini Image Generation (`google/gemini-3-pro-image-preview`) עם תמונת הייחוס שהועלתה כדי ליצור איור Pixar 3D של בן מצייר/יוצר אמנות (תואם לאמוג'י 🎨 ולנושא שלו).

2. **פרומפט**: "Generate a Pixar 3D CGI illustration of this young boy character painting on a canvas with a big smile. He is the smallest character, with very curly dark hair, brown skin, wearing a green shirt. Background: colorful art studio with paint splashes. Warm cinematic lighting, Disney-Pixar aesthetic."

3. **שמירת התמונה** ב-Storage ועדכון הנתיב ב-`GeneratingStep.tsx` — או לחלופין, המרה ישירה ל-asset סטטי חדש `cast-ben-art-new.jpg`.

4. **עדכון הייבוא** ב-`GeneratingStep.tsx` לתמונה החדשה.

### חלופה פשוטה יותר
שימוש ישיר בתמונה שהועלתה (`ben.jpeg`) כ-asset סטטי חדש `cast-ben-art.jpg` — מכיוון שהיא כבר בסגנון Pixar 3D ומציגה את בן בצורה נכונה.

