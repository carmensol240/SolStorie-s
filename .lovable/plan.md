## שינויים במסך סיום הסיפור + כפתורי שיתוף וואטסאפ

### 1. מסך סיום — `src/pages/StoryViewer.tsx`

**הסרת המסך הראשון "סוף – נתראה בסיפור הבא!"**
- מחיקה מלאה של בלוק `isClosingPage` (שורות 1521–1601), כולל תמונת הרקע `castWavingFarewell`, כפתורי "המשיכו לחלק הבא", "חזרה לספרייה", "לדפי הצביעה", ו"ראו איך הספר ייראה מודפס".
- עדכון אינדקס הדפים הוירטואליים (שורות 1404–1408):
  - להסיר את `isClosingPage`
  - `isEndPage` יוגדר כעת על `currentPage === totalVirtualPages` (במקום `+1`)
  - לעדכן `maxPage` ב-`handlePageNav` (שורה 1443) ל-`totalVirtualPages`
  - לעדכן את ה-prop ב-`InstallAppPrompt` (שורה 2096) להסיר את `isClosingPage`
  - לעדכן את הבדיקה `!isClosingPage && !isEndPage` (שורה 1935) להסיר את `isClosingPage`
  - להסיר את ה-import של `castWavingFarewell` (שורה 68) אם לא בשימוש במקום אחר

**שיפור מסך "קסום, לא?" (`isEndPage`, שורות 1603–1675)**
- להוסיף בראש האזור (לפני הכותרת) תמונת `castWavingFarewell` בגובה 180px, `object-cover`, עם פינות מעוגלות עדינות.
- להשאיר את הכותרת `קסום, לא? ✨` ואת בלוק המשוב כמו שהוא.
- להשאיר את שני כפתורי הצביעה/הדפסה (כבר קיימים בשורות 1648–1672) — הם מופיעים פעם אחת בלבד במסך הזה (לא משוכפלים, כי המסך הקודם נמחק).
- להוסיף בתחתית, מתחת לכפתורים, טקסט קטן וסגול: `נתראה בסיפור הבא 💜` (`text-sm text-purple-600`).

### 2. כפתור שיתוף וואטסאפ

**הודעה לשיתוף (helper משותף):**
```text
✨ {childName} קיבל סיפור מותאם אישית ב-SolStorie's! רוצים גם? 👉 soulstory.co.il
```
פתיחה ב-`https://wa.me/?text=` + `encodeURIComponent(message)`.

**מיקום א' — בתוך הסיפור (`StoryViewer.tsx` / `BookHeader.tsx`):**
- להוסיף אייקון קטן ולא בולט (`Share2` מ-lucide, 16–18px, אופסיטי 60%, hover 100%) בפינה שמאל עליונה של כותרת הספר.
- onClick → פתיחת WhatsApp עם שם הילד מהסיפור.

**מיקום ב' — בספרייה (`src/components/ui/polaroid-card.tsx`):**
- להוסיף אייקון `Share2` קטן בפינת הכרטיס (top-left), עם `stopPropagation` כדי לא להפעיל את `onClick` של פתיחת הסיפור.
- onClick → פתיחת WhatsApp עם `childName` מה-props.

### היקף שינויים
- `src/pages/StoryViewer.tsx` — מחיקת בלוק `isClosingPage`, עדכון אינדקסים, שיפור מסך `isEndPage`, הוספת אייקון שיתוף בכותרת.
- `src/components/story/book-frame/BookHeader.tsx` — (אופציונלי) הוספת prop `onShare` לאייקון בפינה שמאל עליונה, או הוספה ישירה ב-StoryViewer מעל ה-BookHeader.
- `src/components/ui/polaroid-card.tsx` — הוספת אייקון שיתוף קטן בכרטיס.

לא ישונה שום דבר אחר.
