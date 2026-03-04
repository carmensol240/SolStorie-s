

## תוכנית: תיקון יחס גודל תמונות הנושא

### הבעיה
תמונות הנושא נחתכות (`object-cover`) במקום להיכנס שלמות למסגרת. הבעיה קיימת ב-3 מקומות:

### שינויים

**1. `src/components/wizard/TopicStep.tsx`** — SimpleTile (שורה 256-257):
- שינוי מ-`h-24` ל-`aspect-square` כדי לשמור על יחס 1:1
- שינוי מ-`object-cover` ל-`object-contain` + רקע `bg-muted/20`

**2. `src/components/wizard/TopicStep.tsx`** — Featured topics (שורה ~200):
- שינוי `object-cover` ל-`object-contain` בתמונת ה-featured

**3. `src/pages/CategoryView.tsx`** (שורה 73-78):
- שינוי מ-`h-24` ל-`aspect-square`
- שינוי מ-`object-cover` ל-`object-contain` + רקע

**4. `src/components/home/CategorySection.tsx`** — כבר מתוקן עם `object-contain`, רק לוודא עקביות

### התוצאה
כל תמונות הנושא יוצגו שלמות בתוך מסגרת ריבועית עם רקע רך, ללא חיתוך של דמויות.

