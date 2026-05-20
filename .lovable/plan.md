## עדכוני דף הרכישה — חבילות לאנשי חינוך, מתנת הרשמה, וחבילות "בקרוב"

### 1) החלפת חבילת אנשי החינוך ל-3 חבילות בשורה (`src/pages/Upgrade.tsx` + `src/config/pricing.ts`)

**`src/config/pricing.ts`** — להוסיף מערך נפרד `EDUCATOR_PACKAGES` עם 3 חבילות שמשקפות את התמחור החדש לאנשי חינוך:

- `educator_basic` — 2 סיפורים, ₪59, badge `להתנסות ✨`
- `educator_popular` — 6 סיפורים, ₪149, badge `מומלץ ⭐`
- `educator_premium` — 10 סיפורים, ₪199, badge `🎓 מקצועית`

כל חבילה כוללת `freeEdits` ו-`freeColoringPages` תואמים למספר הסיפורים (2/2, 6/6, 10/10), בדומה לחבילות הרגילות.
את הקבוע הישן `EDUCATOR_PACKAGE` (חבילת 20 סיפורים ב-₪229) להסיר לחלוטין יחד עם כל השימושים שלו.

**`src/pages/Upgrade.tsx`** — להחליף את ה-block של החבילה היחידה (שורות 465–500) ב-grid של 3 חבילות בעיצוב זהה לזה של החבילות הרגילות שמופיע מעלה ב-`PRICING_PACKAGES.map` (שורות ~391+), כולל לוגיקת `selectedPackage` ו-`handlePurchase` (PayPal flow קיים) — פשוט עם `EDUCATOR_PACKAGES` במקום `PRICING_PACKAGES`. כותרת קטנה מעל ה-grid: "חבילות לאנשי חינוך וטיפול 🎓".

את ה-block של ה-PayPal הייעודי לחבילת החינוך הישנה (שורות 502–536) ואת המצב `showEducatorPayPal`/`'educator'` ב-`failedPurchaseType` להסיר, מאחר וה-3 חבילות החדשות עוברות דרך אותו flow של החבילות הרגילות.

**`supabase/functions/verify-purchase/index.ts`** — בטבלת `packageConfig` להסיר את `educator` הישן ולהוסיף:
```
educator_basic:   { stories: 2,  freeEdits: 2,  coloringPages: 2 },
educator_popular: { stories: 6,  freeEdits: 6,  coloringPages: 6 },
educator_premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
```

**`supabase/functions/paypal-webhook/index.ts`** — להוסיף mapping של הסכומים החדשים (59/149/199) ל-IDs החדשים של אנשי חינוך. מאחר ש-59 ו-149 כבר ממופים ל-`basic`/`popular`, ה-webhook יזקוף לאותם credits בכל מקרה — אין בעיה תפקודית, רק רשומת הרכישה תתויג כ-basic/popular במקום educator. אם רוצים תיוג מדויק יידרש להעביר ב-custom_id את ה-package_id ב-PayPal flow, אבל זה מחוץ לסקופ; משאירים כפי שהוא ל-59/149 ומוסיפים `199 → educator_premium` בלבד.

### 2) שינוי "3 סיפורים במתנה" ל-"2" עבור אנשי חינוך

- `supabase/migrations/...` — מיגרציה חדשה שתעדכן את הפונקציה `public.handle_new_user()`: educators יקבלו `initial_credits := 2` במקום `3` (הורים נשארים 1).
- `src/pages/Auth.tsx` שורה 509 — להחליף "3 סיפורים ראשונים במתנה" ב-"2 סיפורים ראשונים במתנה".
- `src/components/home/LoggedInHome.tsx` שורה 150 — להחליף "3 סיפורים במתנה מחכים לך בחשבון" ב-"2 סיפורים במתנה מחכים לך בחשבון". בנוסף לעדכן את ההמשך מ-"20 סיפורים ב-229 ש״ח" ל-"10 סיפורים ב-199 ש״ח" כדי לא לקדם חבילה שכבר לא קיימת.

### 3) חבילות "בקרוב" — חבילת עריכות וחבילת דפי צביעה

כבר מיושם בקוד הקיים (`src/pages/Upgrade.tsx` שורות 549+ ו-EDIT_KIT block): badge `בקרוב 🔜`, `opacity-60`, וכפתור `disabled`. **לא נדרש שינוי נוסף.**

### לא משתנה

- חבילות הסיפורים הראשיות להורים (basic/popular/premium עם 59/149/219).
- ארגז הכלים (TOOLKIT_SUBSCRIPTION), הקופון, כרטיס המתנה.
- מבנה ה-PayPal, ה-UserDetailsForm, וכל שאר ה-UI.

### פרטים טכניים

- ה-3 חבילות לאנשי חינוך משתמשות באותו `handlePurchase` + `PayPalButton` + `verify-purchase` כמו ההורים, רק עם package_ids נפרדים כדי ש-`verify-purchase` יזקוף את הקרדיטים הנכונים.
- מאחר ש-2 מהחבילות החדשות (59 ו-149) זהות בסכום לחבילות ההורים, ה-fallback של ה-webhook (שמזהה לפי סכום) ימשיך להוסיף את אותם credits — תקין מבחינת המשתמש.
- חבילת ₪199 דורשת רישום ב-`AMOUNT_TO_PACKAGE` של ה-webhook עם 10/10/10.
