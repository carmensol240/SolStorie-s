## עדכון חבילות הסיפורים בלבד

עדכון 3 החבילות הראשיות (basic / popular / premium) — חבילת העריכות, חבילת הצביעה, וחבילת אנשי החינוך נשארות ללא שינוי.

### 1. `src/config/pricing.ts`

עדכון `PRICING_PACKAGES`:

- **basic** → `label: "להתנסות"`, `stories: 2`, `price: 59`, `originalPrice: 59`, `pricePerStory: "29.5₪"`, `freeEdits: 2`, `freeColoringPages: 2`, `badge: "להתנסות ✨"`
- **popular** → `label: "הכי פופולרי"`, `stories: 6`, `price: 149`, `originalPrice: 149`, `pricePerStory: "24.8₪"`, `freeEdits: 6`, `freeColoringPages: 6`, `badge: "מומלץ ⭐"` (נשאר)
- **premium** → `label: "לאוהבי סיפורים"`, `stories: 10`, `price: 219`, `originalPrice: 219`, `pricePerStory: "21.9₪"`, `freeEdits: 10`, `freeColoringPages: 10`, `badge: "הכי משתלם 💰"`

### 2. `supabase/functions/verify-purchase/index.ts`

עדכון `packageConfig` כדי שהזיכוי בצד השרת יתאים:

```ts
basic:   { stories: 2,  freeEdits: 2,  coloringPages: 2 },
popular: { stories: 6,  freeEdits: 6,  coloringPages: 6 },
premium: { stories: 10, freeEdits: 10, coloringPages: 10 },
```

שאר הערכים (`educator`, `coloring_kit`, `edit_kit`, `toolkit_yearly`) נשארים ללא שינוי.

### לא משתנה

- חבילת העריכות הנפרדת (`EDIT_KIT_PACKAGE`)
- חבילת הצביעה הנפרדת (`COLORING_KIT_PACKAGE`)
- חבילת אנשי החינוך (`EDUCATOR_PACKAGE`)
- ארגז הכלים (`TOOLKIT_SUBSCRIPTION`)
- לוגיקת ספירת העריכות (כבר עובדת כסבב תיקונים שלם = עריכה אחת)
- UI של דף `Upgrade.tsx` — הקלפים נטענים אוטומטית מ-`PRICING_PACKAGES`

### הערה על memory

קובץ ה-Core memory מציין `Full prices only (39, 99, 139)`. אעדכן אותו ל-`(59, 149, 219)` כדי לשמור על עקביות עם הכלל "Full prices only".
