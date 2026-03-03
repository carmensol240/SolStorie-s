

## תוכנית: מיני-משחק פאזל בזמן יצירת איורים

### מצב נוכחי
`GeneratingStep` מייצר את טקסט הסיפור (~25 שניות) ומנווט מיד ל-`StoryViewer`. האיורים נטענים פרוגרסיבית ב-StoryViewer דרך Realtime. המשתמש רואה placeholders עד שהאיורים מוכנים.

### שינוי מוצע
במקום לנווט מיד אחרי שהטקסט מוכן, `GeneratingStep` יעבור ל**פאזת פאזל** — המשתמש ישחק עד שהאיורים יהיו מוכנים (או timeout של 90 שניות).

### קבצים חדשים

**1. `src/components/wizard/PuzzleGame.tsx`** — רכיב הפאזל המרכזי:
- מקבל `ageRange`, `storyId`, `childPhoto`, `onStoryReady`
- בוחר תמונה רנדומלית מסט קבוע (דמויות הקאסט: `cast-sol-adventure.jpg`, `cast-ben-art.jpg`, `cast-mia-nature.jpg`, `cast-leo-science.jpg`, `cast-zoe-sports.jpg`, ותמונות נוף)
- חותך את התמונה ל-grid באמצעות CSS `background-position` (Canvas לא נדרש)
- מספר חלקים לפי גיל:
  - `0-2` / `2-4` → 4 חלקים (2×2)
  - `5-7` → 9 חלקים (3×3)
  - `8-10` → 16 חלקים (4×4)
- Drag & Drop באמצעות touch events (מותאם מובייל, ללא ספרייה חיצונית)
- כשהפאזל מושלם → אנימציית כוכבים וברכה
- כפתור "ערבבו מחדש" לשחק שוב

**2. `src/components/wizard/PuzzleCompleteCelebration.tsx`** — אנימציית סיום פאזל עם כוכבים ואמוג'ים

### קבצים שישתנו

**3. `src/components/wizard/GeneratingStep.tsx`:**
- הוספת phase חדש: `'text' | 'puzzle' | 'ready'`
- אחרי שהטקסט מוכן (`storyId` קיים), מעבר ל-`phase: 'puzzle'`
- בפאזת puzzle: הצגת `PuzzleGame` עם הודעה "הסיפור מוכן! האיורים בדרך... בינתיים בואו נשחק 🧩"
- Realtime subscription על `story_pages` לבדוק מתי כל האיורים מוכנים
- כשהאיורים מוכנים → הצגת popup "הסיפור שלך מוכן! 🎉" עם כפתור שמפעיל `onComplete(storyId)`
- Timeout של 90 שניות — אם האיורים לא מוכנים, מציג את כפתור "פתחו את הסיפור" בכל מקרה

### לוגיקת Drag & Drop (מובייל-ראשון)
- חלקי הפאזל מוצגים בשורה מעורבבת מתחת ללוח ריק
- המשתמש גורר חלק (touch) ומשחרר על התא הנכון
- התאמה נבדקת לפי אינדקס מקורי
- חלק שהונח נכון ננעל במקומו עם אנימציית scale

### פרטים טכניים
- אין ספריות חדשות — touch events ו-CSS grid בלבד
- התמונה נטענת ונחתכת ויזואלית עם `background-image` + `background-position` + `background-size`
- ה-Realtime subscription משתמש באותו pattern שכבר קיים ב-StoryViewer
- לא משתנה שום דבר ב-StoryViewer עצמו

