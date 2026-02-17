

# תיקונים דחופים בספריית הסיפורים

## סקירה
ארבעה תיקונים: (1) כפתור מחיקה שלא עובד, (2) נושאים מופיעים באנגלית, (3) הסרת הפס הסגול, (4) חיזוק האיסור על מילים מומצאות בפרומפט.

---

## 1. תיקון מנגנון המחיקה

**הבעיה:** דיאלוג המחיקה ב-`StoryListItem` משתמש ברכיב `Button` רגיל במקום `AlertDialogAction`. הרכיב `AlertDialogContent` של Radix חוסם לחיצות על כפתורים שאינם `AlertDialogAction`, ולכן הלחיצה על "מחק" לא מגיבה.

**הפתרון:** החלפת ה-`Button` ב-`AlertDialogAction` עם עיצוב destructive, בדיוק כמו שמיושם ב-`StoryCard`.

**קובץ:** `src/components/ui/story-list-item.tsx`

---

## 2. תרגום נושאי הסיפור לעברית

**הבעיה:** חלק מהנושאים נשמרים בבסיס הנתונים כ-slugs באנגלית (כמו `blood-test`, `body-safety`, `clean-room`), והם מוצגים כך בספרייה.

**הפתרון:** יצירת מפת תרגום (translation map) מ-slug באנגלית לעברית בקובץ `Library.tsx`, והפעלתה על שדה ה-`topic` לפני הצגתו. הנושאים שכבר בעברית יוצגו כפי שהם.

**קובץ:** `src/pages/Library.tsx`

---

## 3. הסרת הפס הסגול

**הבעיה:** ה-Header של תצוגת הסיפור (`BookHeader.tsx`) הוא פס בגרדיאנט סגול-ורוד-כתום שמופיע בראש העמוד.

**הפתרון:** שינוי הרקע של ה-Header לשקוף/נקי עם צבעי טקסט ארציים, תואמים לעיצוב הספר (גוונים חמים כמו בשאר האפליקציה). הכפתורים יקבלו צבע טקסט כהה במקום לבן.

**קובץ:** `src/components/story/book-frame/BookHeader.tsx`

---

## 4. חיזוק האיסור על מילים מומצאות

**הבעיה:** למרות שהפרומפט כבר מכיל הוראות נגד המצאת מילים, מנוע ה-AI עדיין מייצר מילים לא קיימות לצורך חרוזים.

**הפתרון:** הוספת הוראה נוספת וחזקה יותר בפרומפט, עם דגש על "כלל וטו" - אם יש ספק כלשהו לגבי קיום מילה, חובה להשתמש במילה חלופית פשוטה. תוספת דוגמאות נוספות של מילים אסורות וחיזוק כלל הנסיגה לפרוזה.

**קובץ:** `supabase/functions/generate-story/index.ts`

---

## פרטים טכניים

### story-list-item.tsx - תיקון מחיקה
- שורות 182-190: החלפת `<Button variant="destructive" onClick={...}>` ב-`<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={...}>`
- ייבוא `AlertDialogAction` כבר קיים בקובץ

### Library.tsx - מפת תרגום
- הוספת מפה `TOPIC_HEBREW_MAP` עם כל ה-slugs האנגליים שנמצאו בבסיס הנתונים
- הוספת פונקציה `translateTopic(topic: string)` שבודקת אם ה-topic קיים במפה ומחזירה תרגום, אחרת מחזירה את המקור
- שימוש בפונקציה בעת העברת ה-topic ל-StoryListItem

### BookHeader.tsx - הסרת הפס הסגול
- שורה 64: שינוי `bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400` ל-`bg-[#FAF3E8]/95 backdrop-blur-sm border-b border-[#D4C4B0]`
- שינוי צבע הטקסט מ-`text-[#F5E6D3]` ל-`text-[#5D3A1A]` בכל הכפתורים
- שינוי hover מ-`hover:bg-white/10` ל-`hover:bg-[#D4A574]/20`

### generate-story/index.ts - חיזוק הפרומפט
- הוספת סעיף "כלל וטו מוחלט" עם הדגשה חזקה יותר
- הוספת רשימה מורחבת של מילים אסורות שנוצרו בעבר
- הוספת הוראה: "אם אתה מהסס אפילו לשנייה - המילה אסורה. השתמש במילה אחרת."

### קבצים שישתנו
- `src/components/ui/story-list-item.tsx`
- `src/pages/Library.tsx`
- `src/components/story/book-frame/BookHeader.tsx`
- `supabase/functions/generate-story/index.ts`

### קבצים שלא ישתנו (נעילה)
- Slugs, Admin (999), Footer PDF, מנגנון היפוך כרטיסיות

