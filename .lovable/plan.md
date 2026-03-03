

## תוכנית: תיקון באגים בפאזל ובזמן הצגת הפופאפ

### בעיה 1א — גרירה בדסקטופ לא עובדת טוב
**שורש הבעיה:** `handleMouseDown` לוכד את `board` בזמן הלחיצה ומשתמש בו ב-`handleMouseUp`. אם כבר הונחו חלקים מאז, ה-state ישן ולא תקף — חלקים "נעלמים" או לא נכנסים למקום.

**תיקון ב-`PuzzleGame.tsx`:**
- הוספת `boardRef` (useRef) שמסונכרן עם `board` בכל עדכון
- בפונקציות `handleMouseUp` ו-`handleTouchEnd`: שימוש ב-`boardRef.current` במקום ב-`board` הלכוד מה-closure
- שימוש ב-functional updates (`setBoard(prev => ...)`) בכל מקום במקום ערך ישיר

### בעיה 1ב — הודעת "כל הכבוד" לא מופיעה
**שורש הבעיה:** אותה בעיית closure — כשהחלק האחרון מונח, ה-`setBoard` משתמש בערך ישן, כך שה-board לא באמת מושלם. גם ה-`useEffect` לבדיקת השלמה לא רואה את המצב האמיתי.

**תיקון:** בנוסף לתיקון ה-ref, הוספת בדיקת completion ישירות בתוך ה-`setBoard` callback (שם ה-`prev` מעודכן) — אם הלוח המעודכן שלם, קריאה ל-`setCompleted(true)`.

### בעיה 2 — פופאפ "הסיפור מוכן" קופץ לפני שהאיורים מוכנים
**תיקון ב-`GeneratingStep.tsx`:**
- הסרת ה-timeout של 90 שניות (שורות 250-253) שמציג את הפופאפ ללא קשר למצב האיורים
- הפופאפ יוצג **רק** כש-`illustrationsReady === true` (כל ה-`illustration_url` מלאים)
- הוספת timeout ארוך יותר (180 שניות) כגיבוי קיצוני בלבד, עם הודעה שונה

### קבצים שישתנו
1. `src/components/wizard/PuzzleGame.tsx` — תיקון drag בדסקטופ + בדיקת השלמה
2. `src/components/wizard/GeneratingStep.tsx` — הסרת timeout של 90 שניות, פופאפ רק כשהאיורים מוכנים

