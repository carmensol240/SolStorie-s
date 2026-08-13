תיקון: שמירת מצב הטופס בין מסך 1 למסך 2 (מונע איפוס בחירת פרופיל)

מצב נוכחי
בקובץ `src/pages/CreateStory.tsx` (שורות 302-307) מרונדרים שני בלוקים נפרדים עבור `ChildInfoStep`:

```jsx
{step === 1 && (
  <ChildInfoStep formData={formData} updateFormData={updateFormData} screen={1} />
)}
{step === 2 && (
  <ChildInfoStep formData={formData} updateFormData={updateFormData} screen={2} />
)}
```

מכיוון שאלה הם מופעים JSX נפרדים עם תנאי `&&` שונה, React מפרק ומבנה מחדש את הרכיב כל פעם שהמעבר בין `step === 1` ל-`step === 2` מתרחש. פירוק זה מאפס את `useState` הפנימי של `ChildInfoStep` — בפרט את בחירת הפרופיל/הילד — וגורם לטעינה מחדש של הילד/ה הראשון/ה כברירת מחדל.

שינוי מתוכנן
לאחד את שני הבלוקים לבלוק יחיד, כך ש-`ChildInfoStep` יישמר באותו מיקום בעץ ולא יתפרק:

```jsx
{(step === 1 || step === 2) && (
  <ChildInfoStep
    formData={formData}
    updateFormData={updateFormData}
    screen={step === 1 ? 1 : 2}
  />
)}
```

מה לא משתנה
- `src/components/wizard/ChildInfoStep.tsx` — אין צורך לשנות אותו; לוגיקת ה-`screen` שלו כבר נכונה.
- שלבים 3 ו-4 (התחברות ונושא) נשארים כפי שהם.
- כל קובץ אחר לא ישתנה.

שלבי ביצוע
1. עדכן את `src/pages/CreateStory.tsx` שורות 302-307: אחד את שני הבלוקים הנפרדים לבלוק יחיד עם `(step === 1 || step === 2)`.
2. הרץ בדיקת TypeScript כדי לוודא שלא נשברה טיפוסיות.

סיבה
מניעת איפוס מצב פנימי של `ChildInfoStep` בין מסך 1 למסך 2 על ידי שמירה על אותו מופע React ב-DOM, במקום לגרום לו להתפרק ולהיבנות מחדש.
