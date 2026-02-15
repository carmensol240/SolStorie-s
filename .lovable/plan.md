

# שינויים במסך ההתחברות -- סול מוגדלת, אפקט הצצה, שמירת סיסמה, והסרת בועה

## סקירה

שלושה שינויים עיקריים במסך ההתחברות:
1. הסרת בועת הדיבור ("!שלום! בואו נתחיל בהרפתקה")
2. הגדלת דמות סול ב-50% נוספים + אפקט "הצצה" (Peeking Animation) עם שכבתיות נכונה
3. הוספת צ'קבוקס "זכור אותי" (שמירת סיסמה) בטופס ההתחברות

## שינויים טכניים

### 1. הסרת בועת הדיבור

**קובץ: `src/pages/Auth.tsx` (שורות 1064-1071)**

מחיקת כל בלוק ה-Speech Bubble (הדיב עם הטקסט "!שלום! בואו נתחיל בהרפתקה" והמשולש).

### 2. הגדלת סול ב-50% + אפקט הצצה

**קובץ: `src/pages/Auth.tsx` (שורות 1059-1062)**

- גודל נוכחי: `w-48 h-48 sm:w-52 sm:h-52`
- גודל חדש (50% יותר): `w-72 h-72 sm:w-80 sm:h-80`
- שינוי z-index של סול ל-`z-[5]` (מאחורי התיבה) כדי ליצור אפקט "הצצה מאחורי התיבה"
- שינוי z-index של תיבת ההתחברות (שורה 1074) ל-`z-10` (מלפנים)
- התאמת מיקום: `-top-36 -left-14` כדי שסול תיראה מציצה מאחורי הפינה השמאלית-עליונה
- החלפת `animate-float-gentle` באנימציית כניסה חדשה: slide-and-peek (עולה באלכסון מאחורי התיבה)

**קובץ: `src/index.css`**

הוספת keyframe חדש לאנימציית ההצצה:

```css
@keyframes slide-peek {
  0% {
    opacity: 0;
    transform: translate(20%, 40%);
  }
  100% {
    opacity: 1;
    transform: translate(-10%, -30%);
  }
}

.animate-slide-peek {
  animation: slide-peek 1.8s ease-out forwards;
}
```

### 3. הוספת "זכור אותי" (שמירת סיסמה)

**קובץ: `src/pages/Auth.tsx`**

- הוספת state חדש: `const [rememberMe, setRememberMe] = useState(false);`
- הוספת צ'קבוקס בין שדה הסיסמה לכפתור "שכחתי סיסמה" בטופס ההתחברות (שורה ~1216):

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Checkbox
      id="remember-me"
      checked={rememberMe}
      onCheckedChange={(checked) => setRememberMe(!!checked)}
    />
    <Label htmlFor="remember-me" className="text-sm text-black/70 font-medium cursor-pointer">
      זכור אותי
    </Label>
  </div>
  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-purple hover:underline text-sm font-medium">
    שכחתי סיסמה
  </button>
</div>
```

- הסרת כפתור "שכחתי סיסמה" הנפרד (שורות 1217-1223) כי הוא עובר לשורה המשותפת עם הצ'קבוקס

הערה: מנגנון ה-session של Supabase כבר שומר את ההתחברות ב-localStorage כברירת מחדל, כך שהצ'קבוקס משקף את ההתנהגות הקיימת ומעניק למשתמש תחושת שליטה.

## סיכום ויזואלי

- סול מציצה מאחורי התיבה הלבנה (z-index נמוך יותר) עם אנימציית כניסה רכה של 1.8 שניות
- בועת הדיבור מוסרת לחלוטין
- צ'קבוקס "זכור אותי" מופיע באותה שורה עם "שכחתי סיסמה"
- האפקט רספונסיבי ומותאם לטלפון, טאבלט ומחשב

