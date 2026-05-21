## תיקון פלטת צבעים נחתכת בדסקטופ – Online Coloring Canvas

### הבעיה
ב-`src/components/story/OnlineColoringCanvas.tsx`:
- בדסקטופ (`md+`) כפתורי הצבע גדלים ל-`w-14 h-14` (56px), והפלטה כוללת 3 שורות (כלים + skin/earth + צבעים) – גובה כולל ~170-200px.
- `resizeCanvases` שומר רק `toolbarHeight = 100` בכל הגדלים.
- המעטפת `h-100dvh` עם `overflow-hidden` חותכת את התחתית של הפלטה.

### השינוי
קובץ יחיד: `src/components/story/OnlineColoringCanvas.tsx`

1. ב-`resizeCanvases` להחליף:
   - `const toolbarHeight = isMobile ? 100 : 100;`
   - ב-`isMobile ? 110 : 200` (top bar ~48 + bottom toolbar ~150 בדסקטופ).

2. בשתי שורות הצבעים (SKIN_EARTH + COLORS) להחליף:
   - `md:w-14 md:h-14` → `md:w-11 md:h-11` (44px) כדי שהפלטה תיכנס במסכי לפטופ נמוכים (768-800px).

לא נוגעים בלוגיקת ציור, היסטוריה או כל UI אחר.

### בדיקה
- דסקטופ 1366×768 ו-1280×800: כל שלוש שורות הפלטה נראות במלואן.
- מובייל: ללא רגרסיה (השינוי במידות חל רק ב-`md+`).
