## המרת אנימציית "ספר מתהפך" לקומפוננטה והטמעה בדף הרכישה

### מה ניצור
1. **`src/components/upgrade/FlippingBookAnimation.tsx`** – קומפוננטת React שמכילה את ה-JSX המומר מה-HTML שהדבקת (stage + book-wrap + spine + book + dots + bottom).
   - המרה: `class` → `className`, `style="..."` → `style={{...}}`.
   - State לעמוד הפעיל (`activePage`) + `useEffect` עם `setInterval` שמחליף עמוד כל ~2.5 שניות (מחזורי, עם cleanup).
   - תמיכה ב-RTL מקומית דרך `dir="rtl"` על ה-wrapper (לא משנה את כיוון האפליקציה).
   - תמיכה ב-`prefers-reduced-motion` – ביטול ה-floating/pulse/auto-flip.
2. **`src/components/upgrade/flipping-book.css`** – כל ה-CSS מה-`<style>` עם prefix `fba-` לכל מחלקה כדי למנוע התנגשויות (`.stage` → `.fba-stage`, `.book` → `.fba-book` וכו'). הפונט Rubik יישאר כ-`@import` בראש הקובץ.
3. **`src/pages/Upgrade.tsx`** – הוספת `import FlippingBookAnimation from "@/components/upgrade/FlippingBookAnimation"` ורינדור `<FlippingBookAnimation />` **בראש הדף, מעל החבילות** (לפני הבלוק שמרנדר את כרטיסי החבילות, אחרי הכותרת/Header אם קיימים).

### מה לא נשנה
- הלוגיקה של החבילות (הפרדת הורה/איש חינוך), מחירים, קופונים, PayPal, או כל לוגיקה עסקית.
- שום קובץ אחר מלבד השלושה לעיל.

### שאלה אחת לפני יישום
ב-HTML שהדבקת חסרים תגי `<img>` בפועל וגם פריטי `.page` ו-`.dot` (יש רק את הסקלטון/CSS). יש שתי אפשרויות:

**א.** תשלח את ה-HTML המלא הכולל את ה-`<img src="...">` של עמודי הספר ואת רשימת ה-`<div class="page">`/`<div class="dot">`.
**ב.** אשתמש ב-3 תמונות placeholder קיימות מהפרויקט (למשל מתוך `demo-story` או עטיפות לדוגמה) עד שתספק תמונות סופיות, ואז תוכל להחליף בקלות.

איזה מהן? אם (א) – הדבק את הגרסה המלאה. אם (ב) – אתחיל מיד עם placeholders.
