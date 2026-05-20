## הפרדת חבילות לפי userRole בדף הרכישה

### השינוי ב-`src/pages/Upgrade.tsx`

1. **Grid החבילות הראשיות (`PRICING_PACKAGES.map`)** — לעטוף בתנאי `userRole !== 'educator'`, כך שיוצג רק להורים רגילים.
2. **Grid החבילות החינוכיות + הכותרת "🎓 חבילות לאנשי חינוך וטיפול"** — להשאיר כפי שהוא תחת `userRole === 'educator'`, מוצג רק לאנשי חינוך.
3. **המתנה ל-loading של הרול** — לפני רינדור החבילות, לבדוק את `isLoading` מ-`useAuth()` ולהציג spinner/שלד עד שה-role נטען, כדי שלא יבזיק את ה-grid הלא נכון.
4. **ברירת מחדל של `selectedPackage`** — להשאיר `"popular"` כברירת מחדל להורים. כאשר `userRole === 'educator'` נטען, להגדיר ב-`useEffect` את `selectedPackage` ל-`"educator_popular"` (רק אם הערך הנוכחי הוא עדיין `"popular"` כדי לא לדרוס בחירה ידנית).

### לא משתנה
- כפתור הרכישה התחתון, `handleSelectPackage`, `handlePayPalSuccess`, `ALL_PURCHASE_PACKAGES`.
- כל שאר הרכיבים: ארגז הכלים, חבילות edit/coloring הנפרדות (עם תגית "בקרוב 🔜"), קופון, באנרים.
- אין שינויים ב-edge functions, ב-DB או ב-`pricing.ts`.

### פרטים טכניים
- שני ה-grids נשארים בקובץ; רק התנאי שעוטף אותם משתנה.
- ה-`useEffect` שמסנכרן את ברירת המחדל מותנה ב-`userRole` ו-`isLoading`, ורץ פעם אחת כש-`!isLoading && userRole === 'educator'`.
