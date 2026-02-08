
# תוכנית לעדכון מסך הבית

## סיכום הבקשה
יש לבצע 4 שינויים במסך הבית (GuestLanding):
1. הוספת טקסט "בשילוב כלים מעולם ה-NLP" לתיבה הראשונה
2. הגדרת תמונת הרקע כ-fixed ו-cover
3. שינוי התיבות לשקופות לחלוטין עם אפקט Glassmorphism
4. הסרת כפתור הנגישות הצף מה-App

---

## שלבי הביצוע

### שלב 1: עדכון טקסט בתיבה הראשונה
**קובץ:** `src/components/home/GuestLanding.tsx`

שינוי:
- בתיבה עם הכותרת "התאמה אישית חכמה" (שורה 44-45)
- הוספת "בשילוב כלים מעולם ה-NLP" לתיאור

**לפני:**
```typescript
{
  icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
  title: "התאמה אישית חכמה",
  subtitle: "סיפורים שנבנים עבור ילדכם, עם התאמה רגישה גם לרצף התקשורתי.",
}
```

**אחרי:**
```typescript
{
  icon: <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />,
  title: "התאמה אישית חכמה",
  subtitle: "סיפורים שנבנים עבור ילדכם בשילוב כלים מעולם ה-NLP, עם התאמה רגישה גם לרצף התקשורתי.",
}
```

---

### שלב 2: הגדרת רקע כ-fixed ו-cover
**קובץ:** `src/components/home/GuestLanding.tsx`

שינוי ב-div הראשי של הרקע (שורות 62-68):
- הוספת `position: 'fixed'`
- הוספת `backgroundSize: 'cover'`
- הוספת `left: 0, right: 0, top: 0, bottom: 0`

**לפני:**
```tsx
<div 
  className="absolute inset-0 -mx-4 -mt-3"
  style={{ 
    marginBottom: '-4rem',
    background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F4FF 70%, #F0F8FF 100%)'
  }}
>
```

**אחרי:**
```tsx
<div 
  className="fixed inset-0"
  style={{ 
    background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F4FF 70%, #F0F8FF 100%)',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    zIndex: 0
  }}
>
```

---

### שלב 3: שקיפות מלאה עם Glassmorphism לתיבות
**קובץ:** `src/components/home/GuestLanding.tsx`

שינוי ב-FeatureCard component (שורות 11-21):
- הפחתת ה-opacity לשקיפות גבוהה יותר
- שמירה על backdrop-filter: blur(10px)
- שיפור קריאות הטקסט

**לפני:**
```tsx
style={{
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
}}
```

**אחרי:**
```tsx
style={{
  background: 'rgba(255, 255, 255, 0.25)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
}}
```

בנוסף, שיפור צבעי הטקסטים לקריאות מוגברת:
- שינוי צבע הכותרת מ-`text-purple-800` ל-`text-purple-900 drop-shadow-sm`
- שינוי צבע התיאור מ-`text-purple-600` ל-`text-purple-800 drop-shadow-sm`

---

### שלב 4: הסרת כפתור הנגישות הצף
**קובץ:** `src/App.tsx`

שינויים:
- הסרת `AccessibilityMenu` מה-JSX (שורה 40)
- הסרת ה-import של `AccessibilityMenu` (שורה 9)

**לפני:**
```tsx
import AccessibilityMenu from "@/components/AccessibilityMenu";
...
<BetaBanner />
<AccessibilityMenu />
<Toaster />
```

**אחרי:**
```tsx
// הסרת ה-import של AccessibilityMenu
...
<BetaBanner />
<Toaster />
```

---

## קבצים שישתנו

1. **`src/components/home/GuestLanding.tsx`**
   - הוספת "בשילוב כלים מעולם ה-NLP" לתיאור התיבה הראשונה
   - הגדרת הרקע כ-fixed עם cover
   - שקיפות מוגברת לתיבות עם Glassmorphism
   - שיפור קריאות הטקסטים

2. **`src/App.tsx`**
   - הסרת AccessibilityMenu מה-JSX וה-import

---

## הערות טכניות

### קריאות טקסט על רקע שקוף
- הטקסטים יקבלו `drop-shadow-sm` לשיפור הקריאות
- צבעי הטקסט יהיו כהים יותר (purple-800/900) כדי לבלוט על הרקע

### תמיכה בדפדפנים
- `backdrop-filter` נתמך ברוב הדפדפנים המודרניים
- `WebkitBackdropFilter` מבטיח תמיכה ב-Safari

### הסרת נגישות קולית
- רכיב AccessibilityMenu יוסר מה-App
- הגדרות הנגישות יישארו זמינות רק דרך דף ההגדרות (Settings)
