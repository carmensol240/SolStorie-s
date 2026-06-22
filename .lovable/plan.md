## תוכנית עדכון מחירים

### שינויים נדרשים

1. **PDF להדפסה** — מ-69.90 ל-**59.90 ₪**
   - `src/components/story/PrintPdfOfferModal.tsx` (שורה 53)

2. **חבילת הכי פופולרי (Full)** — מ-129.90 ל-**109.90 ₪**
   - `src/pages/Upgrade.tsx` — מחיר הטייר, מחיר בסיס לחישוב קופון, טקסט כפתור
   - `src/components/story/DemoLockModal.tsx` — כפתור "סיפור + קובץ להדפסה"
   - `src/pages/GiftCard.tsx` — חבילת gift_single_full

3. **חבילת דיגיטלי (Basic)** — מ-49.90 ל-**39.90 ₪**
   - `src/pages/Upgrade.tsx` — מחיר הטייר
   - `src/components/story/DemoLockModal.tsx` — תיאור וכפתור רכישת סיפור דיגיטלי
   - `src/pages/GiftCard.tsx` — חבילת gift_single_digital
   - `src/pages/StoryViewer.tsx` — תיאור ב-paywall

4. **גיפטקארד — 2 סיפורים דיגיטליים** — מ-89.90 ל-**79.90 ₪**
   - `src/pages/GiftCard.tsx` — חבילת gift_two_stories

### מה לא משתנה
- מחירי חבילות כמות (Basic 2 סיפורים 79, Popular 6 סיפורים 199, Premium 279)
- מחירי חבילות אנשי חינוך
- מחירי דפי צביעה (9.90 / 24.90)
- מחירי עריכות (9.90)
- לוגיקת תשלום, webhook, או מיפוי קרדיטים ב-Edge Functions
- כל שאר מסכי האפליקציה