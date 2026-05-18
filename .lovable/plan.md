# עיצוב מחדש של תצוגת האווטאר ב-ChildInfoStep — סגנון דיסני קסום

## מה אשנה (קובץ יחיד)

**`src/components/wizard/ChildInfoStep.tsx`** — בלוק שמתחיל בשורה 730 (התנאי `(formData.childAvatarUrl || isGeneratingAvatar)`):

1. **הסרת המסגרת הסגולה המקווקוות:** מסיר את ה-`div` החיצוני `border-2 border-dashed border-purple-300/70 bg-gradient-to-br ... p-2 sm:p-3 shadow-inner`. במקום זה — `div` שקוף שתופס רוחב מלא בלי border.

2. **אווטאר רחב יותר:** במקום מרובע קבוע `w-64 h-64 md:w-72 md:h-72` — לעבור ל-`w-full max-w-md aspect-square mx-auto` כך שהאווטאר ימלא את הרוחב הזמין של הקלף ויהיה דומיננטי.

3. **זוהר זהוב קסום:** מוסיף סביב האווטאר שכבת glow:
   - `::before` / div אבסולוטי מאחורי האווטאר עם `bg-gradient-radial from-amber-300/60 via-yellow-200/30 to-transparent blur-2xl` שפועם.
   - אנימציית פעימה רכה דרך `animate-pulse` קיים או keyframe חדש `magic-glow` (opacity + scale עדינים).
   - מסגרת רכה במקום ה-`ring-4 ring-amber-300/80` הקיים — נשמרת אבל מתעדנת ל-`ring-[6px] ring-amber-300/60` עם `shadow-[0_0_60px_rgba(251,191,36,0.5)]`.

4. **ניצוצות/כוכבים אנימטיביים:** 4–6 אייקוני `Sparkles` / `Star` (כבר מיובאים מ-lucide) מפוזרים אבסולוטית סביב האווטאר (פינות + צדדים), בגדלים שונים (w-3 עד w-6), בצבעי `text-amber-400`, `text-yellow-300`, `text-pink-300`, כל אחד עם delay שונה ואנימציה `animate-twinkle` (keyframe חדש: opacity 0→1→0 + scale 0.6→1→0.6 + rotate קל). מוסתרים בזמן `isGeneratingAvatar`.

5. **שני keyframes חדשים ב-`tailwind.config.ts`:**
   - `twinkle` — לניצוצות.
   - `magic-glow` — לפעימה של ה-glow.
   - מוסיף גם `animation: { twinkle, "magic-glow" }`.

6. **נשמר ללא שינוי:**
   - ה-pill `דמות בסיפור` עם גרדיאנט סגול-ורוד נשאר מתחת לאווטאר בדיוק כפי שהוא.
   - שני הכפתורים `החלף תמונה מקורית` ו-`עדכן אווטאר` נשארים בדיוק כמו עכשיו (שורות 841–865).
   - מצב `isGeneratingAvatar` עם ה-shimmer וה-spinner נשמר — רק בתוך העיצוב החדש (בלי ה-border המקווקו).
   - כל הלוגיקה, ה-state, ה-handlers, ה-validation והענפים האחרים (`!childAvatarUrl`, מצב מחיקה) — לא נוגעים.

## מה לא ייגע

- אין שינוי ב-`generateAvatarInline`, `handleFileChange`, `updateFormData`, או כל פונקציה.
- אין שינוי באזור התמונה המקורית (שורות 766–778) — רק במצב שבו יש אווטאר/יוצרים אווטאר.
- אין שינוי בקריטריוני האימות (שורות 779–821) או בכפתורי הפעולה (שורות 822–880).
- אין שינוי ב-`index.css` חוץ מהוספת keyframes ב-tailwind config.

## אימות

לאחר ההטמעה: לבדוק שהבילד עובר ושהאווטאר מוצג מוגדל עם זוהר זהוב פועם וניצוצות מנצנצים מסביב, בלי המסגרת הסגולה המקווקוות.
