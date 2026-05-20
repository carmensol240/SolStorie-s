## מטרה
להוסיף במסך הסיום (Closing Page) ב-StoryViewer כפתור חדש "🖨️ הדפס את הסיפור לספר", מתחת לכפתור "לדפי הצביעה". התנהגות הכפתור תלויה אם המשתמש רכש חבילת סיפורים בעבר.

## שינויים — קובץ יחיד: `src/pages/StoryViewer.tsx`

### 1. זיהוי "רכש חבילה"
- מצב חדש: `const [hasPurchasedPackage, setHasPurchasedPackage] = useState(false)`.
- `useEffect` שמופעל כשהמשתמש מזוהה: שאילתה לטבלת `purchases` עבור `user.id` עם `status IN ('completed', 'test_completed')`, `limit(1)`. אם נמצא לפחות רכישה אחת → `setHasPurchasedPackage(true)`.

### 2. מצב הפופאפ
- `const [showBuyToPrintDialog, setShowBuyToPrintDialog] = useState(false)`.

### 3. כפתור חדש ב-Closing Page
- מיקום: ב-`<div className="flex flex-col items-center gap-2 pt-4">` ב-Closing Page, מיד **מתחת** לכפתור "לדפי הצביעה".
- עיצוב: עקבי עם הכפתורים הקיימים (rounded-full, shadow-xl, גרדיאנט שונה לבידול — למשל גרדיאנט סגול/כחול).
- אייקון: `Printer` מ-lucide-react (להוסיף ליבוא הקיים).
- טקסט: `🖨️ הדפס את הסיפור לספר`.
- `onClick`:
  - אם `hasPurchasedPackage === true` וגם `story` קיים → קריאה ל-`exportToPdf(story)`.
  - אחרת → `setShowBuyToPrintDialog(true)`.

### 4. תיבת דו-שיח (AlertDialog) "הפוך את הסיפור לספר אמיתי"
- ממוקמת ליד שאר ה-AlertDialogs בסוף ה-JSX.
- `dir="rtl"`, `max-w-md`.
- **כותרת:** `✨ הפוך את הסיפור לספר אמיתי!`
- **גוף:** `הסיפור של {story.child_name} מוכן ומחכה להיהפך לספר מודפס שישמח אותו שנים קדימה. כדי להוריד את הסיפור כקובץ PDF מוכן להדפסה, בחרי חבילת סיפורים שתתאים לך.`
- **Footer:**
  - `AlertDialogCancel`: `אולי אחר כך`
  - `AlertDialogAction`: `🎁 לרכישת חבילה` → `navigate('/upgrade')` ו-`setShowBuyToPrintDialog(false)`.

## מה לא משתנה
- שום קומפוננטה אחרת, שום מסך אחר, שום לוגיקה אחרת.
- כפתור "לדפי הצביעה" נשאר זהה.
- לוגיקת ההורדה ב-Header נשארת זהה (תמיד מורידה ישירות).