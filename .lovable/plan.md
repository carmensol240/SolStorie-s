## תיקון מוק הכריכה בפופאפ הרכישה

קובץ יחיד: `src/components/paywall/PersonalizedStoryCover.tsx`

### הבעיה
המוק הנוכחי הוא תמונה מלבנית פשוטה (3:4) עם מסגרת לבנה ושוליים רחבים בראש הפופאפ, ואינו דומה למוק היפה יותר של "ספר פיזי" שמופיע ב-`PrintBookPreviewModal` (סגנון `.fba-` עם שדרה + תג SolStorie).

### התיקון
לעצב מחדש את `PersonalizedStoryCover` כך שיציג את אותו מוק ספר פיזי המוצלח:

1. ייבוא `@/components/upgrade/flipping-book.css`.
2. שימוש במבנה: `fba-scene` → `fba-spine` (שדרת הספר עם הטקסט `{name} · SolStorie's™`) + `fba-book` עם:
   - `<img className="fba-cover-img" />` (כבר `object-fit: cover` — ימלא בלי שוליים לבנים).
   - `fba-badge` (✨ SolStorie's™) בפינה.
   - `fba-overlay` עם שם הילד בזהב (כמו בכריכה הקודמת).
3. להוריד את ה-`mb-4` המיותר ולעטוף ב-flex-center חסכוני (`my-1` במקום `mb-4`) כדי לצמצם את הרווח הלבן מעל.
4. להסיר את ה-`border border-white/20` ואת ה-`shadow-2xl` החיצוניים — הסגנון `.fba-scene` כבר מוסיף `drop-shadow` עשיר.

### ללא שינויים
- אין שינוי ב-`DemoLockModal.tsx`, ב-CSS, או בלוגיקת ה-fetch של הכריכה.
- אין שינוי בצינור יצירת הכריכה (נשמר לפעם הבאה כמו שביקשת).
