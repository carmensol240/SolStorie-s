## הקטנת מוקאפ + כותרת מעליו + הסרת תמונת ה-hero

### 1. `src/components/upgrade/FlippingBookAnimation.tsx`
- הוספת כותרת קטנה מעל הסצנה: `✨ הפוך את הסיפור לספר מודפס אמיתי!` (מחלקה `fba-heading`).
- מבנה שאר הקומפוננטה נשמר.

### 2. `src/components/upgrade/flipping-book.css`
- הקטנת הספר לגובה כולל ≤ 250px:
  - `.fba-spine` height: `360px` → `220px`
  - `.fba-book` height: `360px` → `220px`, width: `252px` → `155px`
  - `.fba-title` 20px → 13px, `.fba-subtitle` 13px → 10px, `.fba-logo-text` 10px → 9px
  - `.fba-overlay` padding מצומצם, `.fba-badge` מעט קטן יותר
- הקטנת padding ב-`.fba-root` (`16px 0 24px` → `4px 0 8px`).
- הוספת `.fba-heading` – טקסט לבן 14px bold ממורכז, `margin-bottom: 8px`.
- `.fba-caption` margin-top: `22px` → `10px`, font-size: 13px → 11px.

### 3. `src/pages/Upgrade.tsx`
- **הסרת תמונת ה-hero** (השורות שמרנדרות את `<img src={heroImage} ...>` בתוך ה-div העגול עם ה-glow, סביבות שורות 315–326).
- הסרת ה-import הלא נחוץ של `heroImage` (שורה 21).
- שאר הדף זהה לחלוטין.

### לא נשנה
- שום קובץ אחר, שום לוגיקה עסקית, ולא את מיקום `<FlippingBookAnimation />` בדף.
