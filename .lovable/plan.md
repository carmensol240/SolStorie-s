

## תוכנית: עדכון פרומפט הסגנון האחיד בכל מנועי ייצור התמונות

### מה צריך להשתנות
המשתמש סיפק פרומפט סגנון מדויק שצריך להחליף את כל הפרומפטים הקיימים:

> **Pixar 3D CGI animation style, big expressive eyes, soft rounded features, oversized head with small body, vibrant saturated colors, cinematic warm lighting with glowing accents, fantasy children's book background, high quality render, Disney-Pixar aesthetic**

### קבצים לעדכון

**3 Edge Functions** שמכילות פרומפטי סגנון:

1. **`supabase/functions/generate-topic-images/index.ts`** — `STYLE_SUFFIX` (שורה 18)
2. **`supabase/functions/generate-illustrations/index.ts`** — `fullPrompt` (שורה 183), `stylePrefix` (שורה 277), ופונקציית `buildPrompt` (שורה 478)
3. **`supabase/functions/generate-cover/index.ts`** — `personalizedCoverPrompt` (שורה 168) ו-`coverPrompt` (שורה 277)

### איך
- החלפת הבלוק הארוך הקיים ("3D Disney Pixar cartoon animation style, inspired by 'Coco' and 'Encanto'...") בפרומפט החדש של המשתמש
- שמירה על ההוראות הספציפיות לכל פונקציה (תיאור דמויות, negative prompt, הנחיות מסגור full body)
- הפרומפט החדש יהיה ה-style core, וסביבו ישארו התיאורים הטכניים (negative prompt, full body instructions, character descriptions)

### מה לא משתנה
- תיאורי הדמויות (SOL_DESC, BEN_DESC וכו')
- Negative prompts
- הנחיות מסגור (full body, grounded feet)
- לוגיקת Edge Functions, DB, RLS

