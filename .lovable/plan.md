
# תיקונים דחופים וסופיים בספריית הסיפורים

## סקירה
ארבעה תיקונים שמונעים את השקת האפליקציה: תפריט אפשרויות מוסתר, פס סגול בתצוגת סיפור, תרגום נושאים חסרים, וחיזוק נוסף נגד מילים מומצאות.

---

## 1. תיקון תפריט האפשרויות (Dropdown מוסתר)

**הבעיה:** תפריט שלוש הנקודות ב-StoryListItem נפתח כלפי מטה ומוסתר מתחת לסרגל הניווט התחתון (MobileNavigation).

**הפתרון:** הוספת `side="top"` ל-`DropdownMenuContent` כך שהתפריט ייפתח כלפי מעלה, מעל הפריט. בנוסף הוספת `className="z-[110]"` כדי שיהיה מעל סרגל הניווט (z-100).

**קובץ:** `src/components/ui/story-list-item.tsx` (שורה 139)

---

## 2. הסרת הפס/רקע הסגול מתצוגת הסיפור

**הבעיה:** ב-StoryViewer, הרקע הראשי של הדף עדיין מכיל גרדיאנט סגול-ורוד-כתום (`from-purple-50 via-pink-50 to-orange-50`). בנוסף, יש אלמנטים רבים עם צבעי סגול בדף - כותרות, סרגל התקדמות, כפתורים, ועוד.

**הפתרון:** 
- שינוי הרקע הראשי של StoryViewer מ-`from-purple-50 via-pink-50 to-orange-50` לגווני אדמה חמים (`from-[#FFFBF5] to-[#FAF3E8]`)
- החלפת כל אזכורי `purple` ו-`pink` בדף (ספינר טעינה, כותרות, סרגל התקדמות, כפתורים) לגווני אדמה חמים תואמים
- BookHeader כבר תוקן בגרסה הקודמת ולא דורש שינוי

**קובץ:** `src/pages/StoryViewer.tsx`

---

## 3. תרגום נושאים חסרים

**הבעיה:** מפת התרגום (`TOPIC_HEBREW_MAP`) כבר קיימת ב-Library.tsx, אך ייתכן שחסרים כמה ערכים. בנוסף, יש לוודא שאין באנגלית slugs שלא מכוסים.

**הפתרון:** בדיקת בסיס הנתונים לאיתור slugs חסרים והוספתם למפה. כמו כן, שיפור הפונקציה `translateTopic` כך שתחליף גם מקפים ברווחים כ-fallback אם ה-slug לא נמצא במפה.

**קובץ:** `src/pages/Library.tsx`

---

## 4. חיזוק נוסף נגד מילים מומצאות

**הבעיה:** למרות שהפרומפט כבר מכיל הנחיות חזקות, עדיין מופיעות מילים מומצאות.

**הפתרון:** הוספת הנחיה חדשה בראש ה-system prompt (לפני כל שאר ההנחיות) כ-"meta-instruction" שמדגישה: "לפני כתיבת כל מילה, בדוק האם היא מופיעה במילון אבן-שושן. אם לא - אסור להשתמש בה." בנוסף, הרחבת רשימת הדוגמאות למילים אסורות.

**קובץ:** `supabase/functions/generate-story/index.ts`

---

## פרטים טכניים

### story-list-item.tsx - תפריט
- שורה 139: שינוי `<DropdownMenuContent align="end" className="min-w-[180px]">` ל-`<DropdownMenuContent align="end" side="top" className="min-w-[180px] z-[110]">`

### StoryViewer.tsx - הסרת סגול
- שורה 791: שינוי `bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50` ל-`bg-gradient-to-b from-[#FFFBF5] to-[#FAF3E8]`
- שורות 634-640: שינוי ספינר הטעינה מ-`border-purple-500` ל-`border-[#8B5A2B]`, ו-`text-purple-600` ל-`text-[#8B5A2B]`
- שורות 650-720: שינוי כל ה-purple references במסך generating_illustrations לגווני אדמה
- שורה 727-731: שינוי מסך "הסיפור לא נמצא" מסגול לגווני אדמה
- שורות 916-920: שינוי כותרת הסיפור מגרדיאנט סגול לגווני אדמה חמים

### Library.tsx - תרגום
- שיפור `translateTopic` כך ש-fallback יחליף מקפים ברווחים ויעשה capitalize
- בדיקה שכל ה-slugs הקיימים מכוסים

### generate-story/index.ts - פרומפט
- הוספת meta-instruction חזקה בשורה 10 (לפני כל השאר)
- הרחבת רשימת מילים אסורות

### קבצים שישתנו
- `src/components/ui/story-list-item.tsx`
- `src/pages/StoryViewer.tsx`
- `src/pages/Library.tsx`
- `supabase/functions/generate-story/index.ts`
