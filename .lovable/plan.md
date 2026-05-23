## הבעיה

ב-`PayPalButton.tsx` נטענת SDK של PayPal עם `enable-funding=card` והכפתורים מוצגים ב-layout vertical. PayPal אמור להציג שני כפתורים — PayPal הצהוב, ומתחתיו "Debit or Credit Card". בלחיצה על כפתור הכרטיס לא קורה כלום.

הסיבה הכי סבירה: `Buttons()` עם הגדרה גנרית מצייר את כפתור הכרטיס דרך FUNDING.CARD, אבל בלחיצה הוא מנסה לפתוח חלון popup לטופס כרטיס מתארח. כשהמרצ'נט לא הפעיל "Advanced Card Processing" / "Standard Card Fields" — הלחיצה נכשלת שקטה (no-op), בלי להפעיל onError.

## הפתרון

לרנדר את כפתור הכרטיס בנפרד דרך `fundingSource: paypal.FUNDING.CARD`, כך שאם הוא לא נתמך — `.isEligible()` יחזיר false והכפתור פשוט לא יצויר (במקום כפתור מת). אם הוא כן נתמך — הוא ייפתח כמו שצריך.

## שינויים

**`src/components/paywall/PayPalButton.tsx`** (קובץ יחיד):

ב-useEffect שמרנדר את הכפתורים, להחליף את הקריאה היחידה ל-`window.paypal.Buttons({...}).render(...)` בלולאה שמרנדרת בנפרד כל funding source זמין:

```ts
const fundingSources = [
  window.paypal.FUNDING.PAYPAL,
  window.paypal.FUNDING.CARD,
];

const config = {
  createOrder: (...) => {...},  // זהה לקיים
  onApprove: async (...) => {...},  // זהה לקיים
  onError: (...) => {...},
  onCancel: () => {...},
  style: { layout: 'vertical', shape: 'pill', height: 40, label: 'pay' },
};

for (const fundingSource of fundingSources) {
  const button = window.paypal.Buttons({
    ...config,
    fundingSource,
    style: { 
      ...config.style, 
      color: fundingSource === window.paypal.FUNDING.PAYPAL ? 'gold' : 'black' 
    },
  });
  if (button.isEligible()) {
    await button.render(paypalRef.current);
  }
}
```

זה גם נותן fallback ויזואלי ברור: אם כרטיס לא נתמך בחשבון — אין כפתור שבור, יש רק כפתור PayPal (שגם הוא מאפשר תשלום בכרטיס דרך אורח).

## בדיקה

לאחר היישום: לפתוח את `/upgrade`, לוודא בקונסולה ש-`PayPal buttons rendered successfully` עדיין מודפס, וללחוץ על כפתור הכרטיס השחור — צריך להיפתח חלון/טופס. אם הוא לא נטען כי המרצ'נט לא מאופשר — הכפתור פשוט לא יופיע (וזה התנהגות נכונה במקום no-op).

לא נוגעים בשום קובץ אחר.
