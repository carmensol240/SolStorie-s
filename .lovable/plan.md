## עיצוב מחדש של עמוד הכריכה ב-PDF

שינוי רק בפונקציה `renderCoverPage` בקובץ `src/hooks/use-pdf-export.ts`. שאר הקובץ והעמודים האחרים (הקדשה, טקסט, איור) לא משתנים. גם ה-`drawFooter` הרגיל ימשיך לרוץ — אבל מכיוון שהוא מצויר מעל הקאנבס, נשקול אם להשאיר אותו על הכריכה (ראה הערה בסוף).

### עיצוב חדש (תואם למוקאפ)

1. **רקע מלא**: `<img>` של ה-cover במצב `object-fit: cover` שתופס את כל העמוד (1240x1240) — כך הוא כבר עכשיו, נשמור.

2. **תגית עליונה ימנית** (מתחת לפינה): כיתוב קטן `✨ SolStorie's™` על רקע שקוף עדין:
   - מיקום: `top: 40px; right: 40px`
   - רקע: `rgba(255,255,255,0.15)` עם `backdrop-filter` ו-`border: 1px solid rgba(255,255,255,0.3)`, `border-radius: 999px`
   - טקסט לבן, `font-size: 22px`, padding `10px 20px`

3. **שכבת gradient כהה בתחתית**: 
   - `position:absolute; bottom:0; left:0; right:0; height:55%;`
   - `background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, transparent 100%);`

4. **טקסטים בתוך השכבה הכהה** (יישור מרכז, RTL):
   - **שם הסיפור** (כותרת): לבן, `font-size: 88px`, `font-weight: 900`, מרווח תחתון 20px. הטקסט מגיע מ-`story.topic` (מתורגם דרך `translateTopic`). מסירים את הכיתוב "הסיפור של" כשורה נפרדת.
   - **שורת משנה**: `💛 הסיפור של {childName}` בצבע צהוב/זהב (`#FFD66B`), `font-size: 42px`, `font-weight: 700`.
   - **לוגו תחתון**: `SolStorie's™ · soulstory.co.il` בלבן עמום (`rgba(255,255,255,0.75)`), `font-size: 20px`, `font-weight: 500`, ממוקם 50px מתחתית.
   - מיקום הבלוק: `position:absolute; bottom:0; padding: 0 80px 60px 80px; width:100%;`

### החלפת ה-footer הרגיל בעמוד הכריכה

`captureHtmlToPage` קוראת ל-`drawFooter` בכל עמוד, כולל הכריכה — מה שמצייר קו זהב + `SolStorie's™` + `soulstory.co.il` מעל הכריכה ויוצר כפילות עם הלוגו החדש בתוך השכבה הכהה.

נוסיף פרמטר `skipFooter` ל-`captureHtmlToPage` ונקרא לו עם `true` רק לעמוד הכריכה. שאר העמודים ממשיכים לקבל את ה-footer הקיים בלי שינוי.

### לא משתנה
- מבנה ה-PDF, גודל, יחס, כל שאר העמודים, ה-footer בעמודים אחרים, שמות הקבצים, אינטגרציה עם share/save.
