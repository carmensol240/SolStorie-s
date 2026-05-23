## תיקון 3 בעיות שנשברו היום

### בעיה 1+3: רכישה נכשלת + כפתור כרטיס אשראי לא עובד

**סיבה:** השינוי האחרון ב-`PayPalButton.tsx` החליף קריאה אחת ל-`paypal.Buttons().render()` בלולאה שמרנדרת בנפרד `FUNDING.PAYPAL` ו-`FUNDING.CARD`. רינדור נפרד של `FUNDING.CARD` דורש חשבון סוחר עם "Advanced Card Processing" — אצלנו זה לא מופעל, ולכן הכפתור או לא נטען, או נטען בצורה שגויה שמפילה את ה-`onApprove`.

**תיקון:** להחזיר את `PayPalButton.tsx` ללוגיקה הקודמת — קריאה אחת ל-`window.paypal.Buttons({...}).render(paypalRef.current)` בלי לולאת funding sources. כש-SDK נטען עם `enable-funding=card` ו-`style.layout: 'vertical'`, ה-SDK של PayPal מציג אוטומטית גם את כפתור ה-PayPal הצהוב וגם כפתור "Debit or Credit Card" שחור. לחיצה על כפתור הכרטיס פותחת חלון hosted של PayPal עם שדות לכרטיס (זו ההתנהגות הסטנדרטית — לא inline fields, אלא popup).

### בעיה 2: כפתור "רכשו" תמיד מציג "6 סיפורים ב-199₪"

**סיבה משוערת:** ב-`Upgrade.tsx` שורות 679-683, הטקסט קורא נכון מ-`selectedPkg?.stories`/`selectedPkg?.price`, ו-`handleSelectPackage` מעדכן נכון את ה-state. צריך לאמת בזמן הריצה. ייתכן שיש בעיית caching של `selectedPkg` או שהלחיצה על הכרטיסים לא מגיעה ל-handler (overlay/z-index).

**תיקון:** להוסיף `console.log` ב-`handleSelectPackage` כדי לוודא שה-state מתעדכן, ולוודא ש-`selectedPkg` מחושב מחדש כראוי. אם ה-state אכן מתעדכן והבעיה היא רינדור — לוודא שמפתח ה-key של ה-Button או ה-Fragment לא חוסם רענון. אם הבעיה היא קליק שלא נתפס — להוסיף `type="button"` לכפתורי הכרטיסים.

### קבצים שיתעדכנו (רק אלה)

1. **`src/components/paywall/PayPalButton.tsx`** — להחזיר לרינדור יחיד של `paypal.Buttons()` עם vertical layout, להסיר את הלולאה.
2. **`src/pages/Upgrade.tsx`** — להוסיף `type="button"` לכפתורי בחירת חבילה (parent + educator) ולהוסיף `console.log` קצר ב-`handleSelectPackage` לאימות. אם זה לא פותר — לבדוק את ה-CTA לעומק.

לא נוגעים בשום קובץ נוסף.
