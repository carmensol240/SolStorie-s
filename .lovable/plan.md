
## תיקון 1 — טקסט חופשי לא מופיע בסיפור / ב-PDF

**מקור הבעיה:** ב-`GeneratingStep.tsx` `topicLabel` נשלח כ-`topic` כשהמשתמש בחר "custom". בצד השרת (`generate-story/index.ts`) המחרוזת נמסרת כמשפט מלא ל-AI (`**נושא הסיפור:** ${topic}`) וגם נשמרת ל-`stories.topic` — ומשם היא מוצגת בכריכת ה-PDF ובאפליקציה.

**שינוי:**
1. ב-`GeneratingStep.tsx` — כשהנושא הוא `custom`, לשלוח:
   - `topic: ""` (ריק)
   - `customTopic: formData.customTopic` (שדה ייעודי חדש להעברה)
   - `isCustomTopic: true` (קיים)
2. ב-`supabase/functions/generate-story/index.ts`:
   - לקרוא את `customTopic` מהבקשה.
   - בפרומפט (גרסת עברית ואנגלית): להחליף את `**נושא הסיפור:** ${topic}` בבלוק הנחיה מוסתר כשמדובר בנושא חופשי, למשל:
     ```
     **השראה ליצירת הסיפור (להנחיה בלבד — אסור לצטט מילולית ואסור להכניס את הטקסט הזה לסיפור):**
     ${customTopic}
     ```
   - להנחות מפורשות שאסור להעתיק את הטקסט הזה לתוך עמודי הסיפור.
   - לבקש מהמודל ליצור כותרת קצרה (3–5 מילים) שתישמר כ-`stories.topic` — לשימוש בכריכת PDF ובתצוגה. אם המודל לא מחזיר כותרת, fallback קצר: לקצץ את `customTopic` ל-30 תווים ראשונים.
3. אין לשנות את הצגת `story.topic` במקומות אחרים — היא תקבל אוטומטית את הכותרת הקצרה ולא את הטקסט החופשי.

## תיקון 2 — כריכת PDF מציגה כריכה גנרית

**מקור הבעיה:** ב-`use-pdf-export.ts` `renderCoverPage` מקבל `story.cover_url` ישירות ל-`loadImageAsDataUrl`. כש-`cover_url` הוא נתיב יחסי בבאקט פרטי, `fetch` נכשל ונופל ל-`solMagicBookCover`.

**שינוי ב-`exportSquare` בלבד:**
- לפני קריאת `renderCoverPage`, להוסיף את `story.cover_url` לרשימה שעוברת ל-`fetchSignedUrls(...)` יחד עם איורי העמודים (אותה קריאה אחת, אותו `storyId`).
- להעביר ל-`renderCoverPage` את ה-URL החתום מתוך `signedUrlMap[story.cover_url] || story.cover_url`.
- שום שינוי בלוגיקת ה-fallback — אם החתימה נכשלת באמת, עדיין יוצג `solMagicBookCover`.

## תיקון 3 — דף קשת ריק בין דפי הטקסט

**מקור הבעיה:** ב-`exportSquare` כל עמוד וירטואלי מייצר *תמיד* שני דפי PDF: דף טקסט + דף איור. כש-`illustrationDataUrl` הוא `null`, `renderIllustrationOnlyPage` מצייר ריבוע קשת ריק.

**שינוי ב-`exportSquare` בלבד:** לעטוף את חלק האיור ב-`if (illustrationDataUrl)`:
```ts
if (illustrationDataUrl) {
  container.innerHTML = '';
  container.appendChild(renderIllustrationOnlyPage(illustrationDataUrl));
  await captureHtmlToPage(container, pdf, false);
}
```
כשאין איור — לא נוסף דף כלל. דף הטקסט תמיד נשאר. (פונקציית ה-Rainbow לא נמחקת — רק לא תיקרא בפועל בזרימה הזו, כדי לשמור על שינוי מינימלי.)

## קבצים להעריכה

- `src/components/wizard/GeneratingStep.tsx` — שליחת `customTopic` נפרד ו-`topic` ריק כשמדובר בנושא חופשי.
- `supabase/functions/generate-story/index.ts` — קליטת `customTopic`, הכנסתה כהנחיית פרומפט בלבד, יצירת/שמירת כותרת קצרה כ-`topic`.
- `src/hooks/use-pdf-export.ts` — חתימת `cover_url` ודילוג על דף איור ריק.

לא נוגעים בקבצים נוספים, ב-UI של הקורא הדיגיטלי, או בלוגיקת תרגום הנושאים.
