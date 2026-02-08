
# תוכנית: מסך Onboarding חדש למשתמשים חדשים

## סיכום הבקשה
יצירת מסך קבלת פנים חדש שיוצג לאחר הרשמה, עם:
1. תוכן ה-"About StoryTime" מדף ההגדרות
2. Checkbox חובה להסכמה לתנאי שימוש ומדיניות פרטיות
3. הודעת תשלום: "ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל"
4. כפתור "המשך" מנוטרל עד לסימון ה-checkbox
5. שמירת ההסכמה במסד הנתונים ומניעת הצגה חוזרת

---

## ארכיטקטורה נוכחית

### זרימת האותנטיקציה הקיימת:
```
הרשמה → אישור תנאים (showConsentStep) → הפניה ל-/library
```

הקוד הקיים ב-`Auth.tsx` כולל כבר:
- מסך consent עם tabs לתנאי שימוש ומדיניות פרטיות
- שני checkboxes (קריאת תנאים + הסכמת הורים)
- שמירה של `terms_accepted_at` ו-`terms_version` בטבלת `profiles`

### תוכן "About StoryTime" (מ-Settings.tsx):
נמצא בדיאלוג `aboutOpen` בשורות 171-219. זהו הנרטיב של המייסדת עם תיאור המוצר.

---

## שינויים מתוכננים

### 1. יצירת קומפוננטת תוכן משותפת
**קובץ חדש:** `src/components/shared/AboutStoryTimeContent.tsx`

קומפוננטה שמכילה את כל תוכן ה-"About" כך שניתן לעשות בה שימוש חוזר ב:
- מסך ה-Onboarding החדש
- דיאלוג ה-About ב-Settings.tsx

### 2. יצירת מסך Onboarding חדש
**קובץ חדש:** `src/pages/Onboarding.tsx`

מבנה המסך:
```
┌─────────────────────────────────────┐
│      📖 ברוכים הבאים ל-StoryTime!   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    תוכן About StoryTime     │    │
│  │    (ScrollArea - ניתן לגלול)│    │
│  └─────────────────────────────┘    │
│                                     │
│  ☐ אני מסכים/ה לתנאי השימוש       │
│     ומדיניות הפרטיות               │
│                                     │
│  💳 ניתן לשלם גם בכרטיס אשראי     │
│     ללא חשבון פייפאל               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │        המשך ➔              │    │
│  │   (מנוטרל עד לסימון)        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 3. עדכון Auth.tsx - שינוי הפניית הזרימה
במקום להציג את מסך ה-consent המובנה, הפניה לדף `/onboarding` החדש

### 4. עדכון App.tsx - הוספת Route
הוספת `/onboarding` כ-route מוגן

### 5. עדכון Settings.tsx - שימוש בקומפוננטה המשותפת
החלפת התוכן הקיים בדיאלוג ה-About בייבוא של הקומפוננטה החדשה

---

## פרטים טכניים

### קובץ 1: AboutStoryTimeContent.tsx
```typescript
// קומפוננטה פשוטה שמציגה את כל הפסקאות של About
// עם עיצוב עקבי וקישורים פנימיים
export const AboutStoryTimeContent = () => { ... }
```

### קובץ 2: Onboarding.tsx
- Guard: בדיקה אם המשתמש מחובר
- Guard: בדיקה אם כבר אישר תנאים (`terms_accepted_at` קיים) → הפניה לספרייה
- State: `hasAgreed` (boolean) לבקרת ה-checkbox
- Handler: `handleContinue` שומר `terms_accepted_at` ו-`terms_version` ומפנה ל-`/library`

### קובץ 3: Auth.tsx - שינויים
שורות 295-303: במקום `setShowConsentStep(true)`, הפניה ל-`/onboarding`

```typescript
if (!data?.terms_accepted_at) {
  navigate("/onboarding");
  return;
}
```

### קובץ 4: App.tsx - שינויים
הוספת route חדש:
```tsx
<Route path="/onboarding" element={<Onboarding />} />
```

### קובץ 5: Settings.tsx - שינויים
החלפת תוכן הדיאלוג בייבוא:
```tsx
import { AboutStoryTimeContent } from "@/components/shared/AboutStoryTimeContent";
// ...
<DialogContent>
  <AboutStoryTimeContent />
</DialogContent>
```

---

## שמירה במסד הנתונים
הטבלה `profiles` כבר מכילה את העמודות הנדרשות:
- `terms_accepted_at` (timestamp with time zone)
- `terms_version` (text)

לא נדרשים שינויים בסכמה.

---

## עיצוב
- רקע: גרדיאנט סגול-לבן כמו במסך ה-consent הקיים
- כותרת: גרדיאנט צבעוני (סגול-ורוד-כתום) בהתאם לזהות המותג
- תוכן: ScrollArea עם גובה מקסימלי
- Checkbox: גדול (h-5 w-5) עם label ברור
- הודעת PayPal: כרטיס מודגש עם אייקון כרטיס אשראי
- כפתור: גרדיאנט המותג, מנוטרל (opacity-50) עד לסימון

---

## סיכום הקבצים לשינוי

| קובץ | פעולה |
|------|--------|
| `src/components/shared/AboutStoryTimeContent.tsx` | יצירה |
| `src/pages/Onboarding.tsx` | יצירה |
| `src/App.tsx` | הוספת route |
| `src/pages/Auth.tsx` | שינוי הפניה |
| `src/pages/Settings.tsx` | שימוש בקומפוננטה משותפת |
