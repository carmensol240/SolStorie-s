# דו"ח QA – זרימות end-to-end

הבדיקה בוצעה סטטית (קוד + DB + לוגים), לא דרך תשלום חי ב-Grow/PayPal. כל באג מסומן בעדיפות. אין כאן תיקונים — רק ממצאים.

---

## 🔴 P0 – בלוקרים

### 1. אדמין: כל האימיילים מציגים "—" (RPC נכשל ב-permission denied)
- בקונסול בפרודקשן (כרגע, כל 30 שניות):
  `permission denied for function get_admin_user_emails (code 42501)`
- בדקתי ב-DB: ל-function יש EXECUTE רק ל-`service_role` ו-`postgres`. אין EXECUTE ל-`authenticated`.
- האדמין רץ עם role=authenticated מהקליינט, ולכן ה-RPC נכשל תמיד. ה-fallback ל-`profiles.email` עובד רק עכשיו שעשינו backfill, אבל **עמודת ה-name עדיין נופלת ל-displayName מהאימייל** במקום שם אמיתי, ובמסכי stories/purchases/errors יוצג email מהפרופיל בלבד — בלי שם.
- **תיקון נדרש (לא מבוצע):** `GRANT EXECUTE ON FUNCTION public.get_admin_user_emails() TO authenticated;`

### 2. רכישת "Coloring Bundle" (₪24.90) נותנת רק 5 קרדיטים, לא לפי אורך הסיפור
- `packageConfig.coloring_bundle = { coloringPages: 5 }` (קבוע).
- הציפייה של המשתמש: "חבילת צביעה לכל הסיפור" → אבל סיפור עם 8–10 איורים יקבל רק 5 קרדיטים.
- הזרימה הדינמית קיימת רק עבור `coloring_story` (סופר את `story_pages` עם illustration_url). `coloring_bundle` לא משתמשת בה.
- **השלכה:** המשתמש משלם ומקבל פחות צביעות ממה שהובטח.

---

## 🟠 P1 – באגים משמעותיים

### 3. Grow webhook: זיהוי מתנה שגוי לקונה שיש לו pending_gift ישן
- ב-`grow-webhook/index.ts` שורות 188–196: כל רכישה של משתמש שיש לו `pending_gifts` עם `status=pending` ב-2 השעות האחרונות **מסווגת אוטומטית כמתנה** — בלי לבדוק שה-`package_id` תואם.
- תרחיש: משתמש פתח טופס מתנה ולא השלים, ואז קנה לעצמו חבילה רגילה תוך שעתיים → הקונה לא יקבל קרדיטים, ובמקום זאת תיווצר קופון מתנה שהוא לא יודע עליה.

### 4. רכישת ₪49.90 דרך Grow לא תמיד פותחת את הסיפור הנוכחי
- ה-unlock של סיפור ספציפי קורה רק אם `cField3=storyId` הועבר בקישור Grow (`openGrowCheckout({ storyId })`).
- אם המשתמש הגיע ל-Grow מ-`/upgrade` או מבאנר כללי (בלי context של סיפור), `storyId` לא מועבר → `applyPurchaseCredits` מוסיף 1 story_credit + free_edit + coloring + 1 unlock רק אם storyId קיים. ללא storyId → המשתמש מקבל קרדיט גנרי אבל **הסיפור הנוכחי לא נפתח אוטומטית**. הוא יצטרך "לבזבז" קרדיט כדי לפתוח אותו.
- צריך לוודא שכל call site מ-StoryViewer/paywall מעביר `storyId`.

### 5. רכישת PDF (₪69.90) לא יוצרת entitlement בפועל
- `packageConfig.pdf = { stories: 0, freeEdits: 0, coloringPages: 0, pdfDownload: true }`.
- `applyPurchaseCredits` לא עושה כלום עם `pdfDownload` — אין שדה בפרופיל, אין רשומה ב-`pdf_downloads`. רק רשומה ב-`purchases`.
- צריך לבדוק איך `use-pdf-download-limit` קובע זכאות. נראה שמסתמכים על קיום רשומת purchases — אבל אז המשתמש יוכל להוריד גם אם קנה חבילה אחרת? לא ברור.

### 6. אדמין dashboard – טבלת unlocks/users לא תמיד מציגה את הסיפור היעד
- handler `handleUnlockStory` עובד טכנית (insert ל-`story_unlocks`).
- אבל הדיאלוג שולף סיפורי המשתמש דרך SELECT רגיל (RLS = stories.user_id = auth.uid) — אדמין רואה אותם רק דרך policy "Admins can view all stories". זה אמור לעבוד, אבל אם הסיפור ב-`generation_status != ready` או לא מופיע ברשימה המסוננת בקליינט, האדמין לא ימצא אותו.

---

## 🟡 P2 – אי-עקביות

### 7. Educator credits: trigger נותן 2, התיעוד אומר 3
- `handle_new_user` ב-DB: educator → 2 קרדיטים, parent → 1.
- ה-memory `auth/registration-process-updated`: educator → 3 קרדיטים.
- אחד מהם שגוי. צריך החלטה.

### 8. Password reset: נשלח מ-`onboarding@resend.dev` (לא דומיין מאומת)
- ב-`send-password-reset` (וב-`grow-webhook` של ההודעות לאדמין) – `from: "SoulStory <onboarding@resend.dev>"`.
- מיילים יגיעו לספאם אצל חלק ניכר מהמשתמשים, ו-Resend בעצמם ימחקו מיילים שנשלחו מהדומיין הזה כשהוא overused.
- צריך לאמת דומיין (soulstory.co.il) ב-Resend ולהחליף את ה-from.

### 9. Redeem coupon – race condition (משני)
- ב-`redeem-coupon/index.ts`: בודק `current_uses < max_uses` ואז `UPDATE current_uses = current_uses + 1` בשני שלבים נפרדים, ללא נעילה.
- שני clients שמריצים בו-זמנית עם `max_uses=1` יכולים להצליח שניהם. לקופוני מתנה זה משמעותי.

---

## 🟢 P3 – הערות קלות

### 10. `twoStories` ב-`GROW_LINKS` הוא string ריק
- כל קריאה ל-`openGrowCheckout('twoStories')` תיכשל בשקט (return מוקדם). אם יש כפתור פעיל לחבילה הזאת — לא יקרה כלום.

### 11. רשימת המיילים לאדמין: `solstories.nlp@gmail.com` hardcoded בשני edge functions
- אם הכתובת תשתנה צריך לערוך ב-2 מקומות. לא קריטי.

### 12. עמודת `display_name` ריקה עבור 105/125 פרופילים
- אחרי ה-backfill וה-trigger המתוקן, רק *הרשמות חדשות* יקבלו display_name. הישנים יישארו ריקים — fallback ל-email local-part מהפרופיל.

---

## ✅ נבדק ועובד נכון

- **Paywall אחרי עמוד 4:** `DEMO_VIRTUAL_PAGE_LIMIT = 4` נאכף ב-`StoryViewer.tsx:1628`. הניווט קדימה חסום נכון, פותח `setDemoPaywallOpen(true)`.
- **Idempotency של Grow webhook:** בדיקה לפי `LIKE 'grow_${transactionId}_%'` ב-`purchases` — מונע double-credit.
- **Reset password page:** מאמת `token_hash + type=recovery` דרך `verifyOtp` לפני שמראה את הטופס. תקין.
- **Coupon extra_stories:** מוסיף `free_stories` ל-`story_credits` בפרופיל, רושם ב-`coupon_redemptions`, מונע שימוש כפול ע"י אותו משתמש. לוגית תקין (מלבד race ב-#9).
- **Admin manual unlock:** ה-insert ל-`story_unlocks` עם `unlock_type='admin_manual'` עובד; idempotent ע"י unique constraint (קוד 23505 → toast "כבר פתוח").
- **Grow → purchases ב-admin dashboard:** Realtime subscription ל-`purchases` קיים, אמור להופיע מיידית. אין רשומות grow_* כרגע ב-DB אז לא יכולתי לאמת בפועל.

---

## הצעת סדר תיקונים (כשתאשר)

1. **P0 #1** – GRANT EXECUTE על RPC לאדמין (migration של שורה אחת).
2. **P0 #2** – להפוך `coloring_bundle` לדינמי לפי story_pages, או לתמחר לפי גודל.
3. **P1 #3** – להוסיף בדיקת התאמת package_id בזיהוי מתנה ב-grow-webhook.
4. **P1 #4** – לוודא ש-`openGrowCheckout` מקבל `storyId` מכל call site של paywall.
5. **P1 #5** – להגדיר entitlement ברור ל-PDF (שדה profile או טבלה ייעודית).
6. **P2 #7** – ליישר educator credits (2 vs 3).
7. **P2 #8** – לאמת דומיין ב-Resend.
8. שאר ה-P2/P3 לפי סדר עדיפות שתחליט.

תאשר אילו לטפל ובאיזה סדר ואני אכין migrations + תיקוני קוד.
