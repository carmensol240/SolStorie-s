

## עדכון PublicStoryViewer + PDF לפריסת fullscreen + overlay

StoryViewer.tsx כבר מיושם נכון (איור fullscreen + טקסט overlay + איחוד לגיל 0-2). צריך ליישר את שני הקבצים הנוספים.

### 1. PublicStoryViewer.tsx — פריסת fullscreen + overlay

**מצב נוכחי:** פריסת open-book-spread עם איור בצד שמאל וטקסט בצד ימין (שורות 184-264).

**שינויים:**
- הסרת כל פריסת ה-`open-book-spread` מדפי התוכן
- כל דף תוכן: איור fullscreen (`absolute inset-0 w-full h-full object-cover`) + gradient overlay בתחתית + טקסט לבן עם drop-shadow
- הוספת לוגיקת איחוד דפים לגיל 0-2 (כמו ב-StoryViewer) — `age_range` כבר זמין ב-PublicStory type
- כפתורי ניווט prev/next מעל ה-overlay
- דפי כריכה וסוף נשארים בסגנון דומה אבל גם עם איור fullscreen

### 2. use-pdf-export.ts — פריסת fullscreen + overlay

**מצב נוכחי:** 
- Portrait: איור קטן (~40% גובה) עם טקסט מתחת (שורות 240-286)
- Landscape: spread עם איור בצד אחד וטקסט בצד שני (שורות 326-378)

**שינויים בשני המצבים:**
- כל דף תוכן: איור fullscreen כרקע (`position:absolute; inset:0; object-cover`) 
- gradient overlay כהה בתחתית (`linear-gradient to top from rgba(0,0,0,0.75)`)
- טקסט לבן מעל ה-gradient עם text-shadow
- הסרת `renderTextOnlyPage` — כל דף עם placeholder דקורטיבי אם אין איור
- מספר עמוד בתחתית בלבן שקוף

### קבצים
- `src/pages/PublicStoryViewer.tsx`
- `src/hooks/use-pdf-export.ts`

