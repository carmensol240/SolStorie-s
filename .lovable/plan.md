## תיקון כפתור הסגירה (X) במסך הרכישה `/upgrade`

### הבעיה
כרגע `handleClose` ב-`src/pages/Upgrade.tsx` תמיד מנווט ל-`"/"` ומוחק את `pendingStoryReturn`, כך שהמשתמש "נזרק" למסך הבית במקום לחזור למסך שממנו הגיע (בדרך כלל מסך הצעת רכישה של הסיפור, או הספרייה/הגדרות וכו').

### השינוי (קובץ יחיד: `src/pages/Upgrade.tsx`)
לעדכן את `handleClose` כך שיחזיר את המשתמש למסך הקודם לפי סדר עדיפויות:

1. **אם הגיע מסיפור (paywall של DemoLockModal):** קיים `sessionStorage.pendingStoryReturn` שמכיל `{ path, page }`. במקרה זה לנווט חזרה ל-`${path}?paywall=1` (ה-StoryViewer כבר מאזין ל-`paywall=1` ופותח שוב את ה-`DemoLockModal`). לנקות את `pendingStoryReturn` אחרי הקריאה.
2. **משתמש רשום שהגיע ממסך אחר** (ספרייה / הגדרות / Adventure / יצירת סיפור ללא קרדיטים): להשתמש ב-`navigate(-1)` כדי לחזור בדיוק למסך הקודם.
3. **Fallback** (אין היסטוריה ואין `pendingStoryReturn`): לנווט ל-`"/"`.

לא ייגעו בקבצים אחרים, ולא בהתנהגות אחרת של המסך.

### Pseudocode
```ts
const handleClose = () => {
  try {
    const raw = sessionStorage.getItem("pendingStoryReturn");
    if (raw) {
      const { path } = JSON.parse(raw);
      sessionStorage.removeItem("pendingStoryReturn");
      if (path) { navigate(`${path}?paywall=1`); return; }
    }
  } catch {}
  if (user && window.history.length > 1) { navigate(-1); return; }
  navigate("/");
};
```
