
# תוצר: מיפוי חבילות בלבד (ללא שינויי קוד)

הבקשה הייתה למפות – לא לשנות. הפלט הרלוונטי הוצג בהודעה מעל טבלה זו וכולל:

1. **8 חבילות פעילות בפועל** (basic, popular, single_story, coloring_single, coloring_bundle, pdf, gift_single_digital, gift_two_stories, gift_single_full) – עם packageId, growKey, מחיר UI, מקור UI וקרדיטים אמיתיים מתוך `purchase-credits.ts`.
2. **קוד מת ב־`pricing.ts`**: כל `PRICING_PACKAGES`, `EDIT_KIT_PACKAGE`, `COLORING_KIT_PACKAGE`, `EDUCATOR_PACKAGE`, `EDUCATOR_PACKAGES`, `TOOLKIT_SUBSCRIPTION` – **לא מיובאים לאף קובץ UI**.
3. **חבילות backend ללא UI**: `premium`, `educator_*`, `coloring_kit`, `edit_kit`, `toolkit_yearly`, `single_story_digital`, `single_story_full` – מוגדרות ב־`packageConfig` אך אין להן growKey ואין להן מסלול משתמש.
4. **סיכונים שזוהו במיפוי**:
   - `PrintPdfOfferModal` מציג 59.90 ₪ אך `GROW_LINKS.pdf` מחייב 69.90 ₪.
   - `packageIdFromAmount(39.9)` מחזיר `single_story_digital` (1+1+1) בזמן ש־Upgrade "דיגיטלי" רוכשת `basic` (2+2+2) – סתירה אם ה־webhook נופל למיפוי לפי סכום.
   - `gift_two_stories` משתמש ב־`grow.website/products/view/…` (לא `pay.grow.link`) – ייתכן שאינו תומך ב־cField1/cField2.

## המשך אפשרי (רק לאישורך – לא מתבצע עכשיו)

בהמשך, כשתחליטי מה למחוק, אוכל:
- להסיר מ־`pricing.ts` את כל ה־exports שאינם בשימוש.
- להסיר מ־`packageConfig` את המפתחות שאין להם growKey ואין להם UI.
- ליישר את מחיר ה־PDF ב־Grow למחיר המוצג (או להיפך).
- להסיר את הסתירה ב־`packageIdFromAmount` עבור 39.90.

אין קבצים לשנות בשלב זה – זו הודעת מיפוי בלבד לפי בקשתך.
