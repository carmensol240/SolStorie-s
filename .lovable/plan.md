
# שיפור קולקטיבי - תצוגת סיפורים כספר פיזי מושלם

## סיכום השינויים

5 תיקונים מרכזיים: (1) תיקון חיתוך טקסט עם padding קפדני, (2) ליטוש עיצוב הספר הפתוח, (3) עדכון PublicStoryViewer לפריסת ספר, (4) תיקון PDF לפורמט 1:1 עם שוליים 20 מ"מ, (5) שמירת נעילת landscape במובייל + שחרור ביציאה.

---

## 1. תיקון חיתוך טקסט (StoryViewer.css + StoryViewer.tsx)

**בעיה**: הטקסט נחתך בחלק העליון והתחתון של העמוד.

**תיקון**:
- `.open-book-page-right`: הגדלת `padding-top` ל-`20px` ו-`padding-bottom` ל-`20px`
- הגדרת `overflow-y: auto` כדי שטקסט ארוך יהיה ניתן לגלילה במקום להיחתך
- הטקסט ב-StoryViewer.tsx: הוספת `overflow-y-auto` ו-`min-h-0` ל-container של הטקסט כדי למנוע גלישה

## 2. ליטוש עיצוב הספר הפתוח (StoryViewer.tsx)

**שיפורים**:
- וידוא שהחיצים לא חוסמים טקסט - הזזתם לקצוות עם `opacity` מופחת שעולה ב-hover
- הוספת אפקט `fade` חלק יותר בין דפים (כבר קיים, רק ליטוש)
- וידוא שב-portrait mode הספר נערם אנכית בצורה נכונה (כבר קיים)

## 3. PublicStoryViewer - עדכון לפריסת ספר פתוח (PublicStoryViewer.tsx)

**בעיה**: הצפייה הציבורית (קישור וואטסאפ) מציגה תצוגה בסיסית - איור למעלה וטקסט למטה, ללא עיצוב ספר.

**תיקון**:
- שימוש בפריסת `open-book-spread` זהה ל-StoryViewer
- צד ימין: טקסט, צד שמאל: איור
- הוספת חיצי ניווט RTL
- נעילת landscape במובייל
- שימוש ב-`getPublicIllustrationUrl` במקום signed URLs (הבאקט ציבורי)
- ייבוא `StoryViewer.css` לשימוש באותם סגנונות

## 4. PDF - תיקון לפורמט 1:1 עם שוליים 20 מ"מ (use-pdf-export.ts)

**בעיה**: ה-landscape PDF עדיין משתמש ב-`buildSpreads` שמקבץ 2 עמודים. כמו כן, אין שוליים קפדניים של 20 מ"מ.

**תיקון**:
- הסרת `buildSpreads` מ-landscape - כל עמוד סיפור מייצר PDF spread נפרד (איור שמאל, טקסט ימין)
- שוליים: `padding: 20mm` בכל הצדדים ב-HTML שנשלח ל-html2canvas
- Portrait: שמירה על פורמט נוכחי (איור + טקסט באותו עמוד) עם שוליים 20 מ"מ
- וידוא שטקסט ארוך לא נחתך - הפונט מותאם לגודל ה-container

## 5. Landscape Lock (StoryViewer.tsx)

**סטטוס**: כבר מיושם - `screen.orientation.lock('landscape')` ב-`useEffect` עם `unlock` ב-cleanup. אין צורך בשינוי.

---

## פרטים טכניים - קבצים לעריכה

### `src/pages/StoryViewer.css`
- `.open-book-page-right`: עדכון `padding-top: 20px`, `padding-bottom: 20px`
- הוספת `scroll-padding-top: 20px` למניעת חיתוך עליון בגלילה

### `src/pages/StoryViewer.tsx`
- שורה 1133: עדכון padding של עמוד ימין ל-`px-6 py-5 md:px-10 md:py-6`
- שורה 1169: הוספת `overflow-y-auto` ו-`min-h-0` ל-container הטקסט
- שורות 1137-1166: הקטנת כפתורי החיצים ל-`w-7 h-7` והפחתת opacity ל-`opacity-50 hover:opacity-100`

### `src/pages/PublicStoryViewer.tsx`
- שכתוב מלא לפריסת ספר פתוח:
  - ייבוא `StoryViewer.css` ו-`getPublicIllustrationUrl`
  - עמוד פתיחה: כותרת ימין, איור עמוד 1 שמאל
  - עמודי סיפור: טקסט ימין, איור שמאל (כמו StoryViewer)
  - עמוד סיום: "תודה שקראתם" + כפתור ליצירת סיפור
  - חיצי ניווט RTL
  - נעילת landscape במובייל
  - שימוש ב-`getPublicIllustrationUrl` (הבאקט ציבורי, אין צורך ב-signed URLs)

### `src/hooks/use-pdf-export.ts`
- הסרת הפונקציה `buildSpreads` (לא נחוצה יותר)
- `exportLandscapeBook`: כל עמוד סיפור = spread נפרד:
  - צד ימין: טקסט בלבד עם padding 20 מ"מ
  - צד שמאל: איור בלבד עם padding 20 מ"מ
- `exportPortrait`: עדכון padding ל-20 מ"מ בכל הצדדים (`padding: 76px` = ~20mm * 3.78)
- וידוא שהטקסט לא נחתך: `overflow: hidden` מוסר, `word-wrap: break-word` מוסף

### לא ישתנה
- `BookFrame.tsx`, `BookHeader.tsx`, `NavigationArrows.tsx` - נשארים כמו שהם
- לוגיקת הדמויות (Sol/Ben) - אינה חלק מהקוד הזה, מטופלת ב-edge functions של יצירת איורים
