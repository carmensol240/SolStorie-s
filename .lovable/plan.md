
# הפיכת פופאפ הרכישה לפופאפ העשיר

## הבעיה (אומתה בקוד)
`src/components/story/DemoLockModal.tsx` הוא עדיין הפופאפ הישן: רק כותרת, תיאור, וכפתור "לרכישת חבילה" שמנווט ל-`/upgrade`. הוא לא מציג כריכה אישית, לא את 19.90₪, ולא את "🎁 הסיפור נוסף אוטומטית". זו הסיבה שב-Incognito רואים את הפופאפ הישן — כי הוא לא שונה מעולם.

`src/pages/Upgrade.tsx` כבר מכיל את כל האלמנטים הללו (אומת — שורות 351, 432, 444-455), פשוט המשתמש לא תמיד מגיע לשם — הוא רואה קודם את ה-Modal הקצר ולוחץ "לא עכשיו".

## השינויים

### 1. `src/components/story/DemoLockModal.tsx` — שכתוב מלא
- Prop חדש: `storyId?: string`
- מבנה חדש (RTL):
  - כותרת קצרה (props קיימים)
  - אם יש `storyId`: `<PersonalizedStoryCover storyId={storyId} />` במרכז (~200px)
  - כפתור ראשי (gradient סגול-ורוד-כתום): **"📦 חבילת סיפורים"** → ניווט ל-`/upgrade?firstStory={storyId}`
  - מתחת לכפתור החבילה, כיתוב קטן: `🎁 סיפור הדוגמא נוסף אוטומטית בחינם`
  - מפריד דק "או"
  - כפתור משני (glass/outline): **"רק הסיפור הזה — 19.90₪ 📖"** → ניווט ל-`/upgrade?firstStory={storyId}&mode=single`
  - לינק "לא עכשיו" (ghost) בתחתית
- שמירת `pendingStoryReturn` ב-sessionStorage לפני כל ניווט (לוגיקה קיימת — לשמר)
- אם אין `storyId` (שימוש שאינו מסיפור) — להתנהג כמו היום: ללא כריכה, ללא כפתור 19.90, רק כפתור חבילה.

### 2. `src/pages/StoryViewer.tsx` — שינוי נקודתי
שורות 2038-2044: להוסיף `storyId={storyId}` לשתי המופעים של `<DemoLockModal>`.
לא נוגעים בשום דבר אחר בקובץ הזה.

### 3. `src/pages/Upgrade.tsx` — תוספת קצרה
- קריאת פרמטר חדש: `const mode = searchParams.get('mode')`
- `useEffect` חדש שמופעל פעם אחת אחרי טעינה: אם `mode === 'single' && firstStoryId && user` → `setShowSinglePayPal(true)` (גלילה אוטומטית אל ה-PayPal אופציונלי)
- שאר הקובץ ללא שינוי.

## קבצים שלא ייגעו
כל מה שמחוץ לזרימת פופאפ-הרכישה והשדרוג:
- `generate-illustrations`, `generate-story`, `retry-illustration`, `_shared/style-config.ts` — הבעיה של אי-התאמת טקסט↔תמונה תיפתר בסבב נפרד.
- שום קובץ עיצוב/לוגיקה אחר.

## אימות אחרי הפריסה
1. פתיחת `/story/{slug}` עם משתמש דמו → לחיצה על שמירה/הורדה → הפופאפ החדש נפתח עם כריכה אישית, שני כפתורים, וכיתוב המתנה.
2. לחיצה על "רק הסיפור הזה 19.90₪" → ניווט ל-`/upgrade?firstStory=...&mode=single` ופתיחה אוטומטית של PayPal לתשלום בודד.
3. לחיצה על "חבילת סיפורים" → `/upgrade?firstStory=...` עם הכריכה האישית בראש העמוד.
4. בדיקה ב-Incognito אחרי Publish — צריך לראות מיד את הפופאפ החדש.
