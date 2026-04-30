## מטרה

Do not change anything else in the app, only the navigation behavior"

החלפת חוויית "דף אחר דף" עם fade-out/fade-in (שגורם להבזק לבן רגעי בזמן שהאיור הבא נטען) ב-**גלילה אנכית רציפה** של כל דפי הסיפור — כל דף הוא section במסך מלא, וגלילה חלקה עוברת ביניהם ללא ריצוד וללא דף לבן.

## קבצים שיושפעו

- `src/pages/StoryViewer.tsx` — שינוי ארכיטקטורת התצוגה הראשי
- `src/pages/StoryViewer.css` — סגנונות snap-scroll

(לא נוגעים ב-`PublicStoryViewer.tsx` ולא ב-`FlipbookViewer.tsx` — המשתמש דיבר על קורא הסיפור הראשי. אם נדרש גם שם, אפשר להוסיף בהמשך.)

## עיצוב טכני

### 1. רינדור כל הדפים יחד במקום דף נוכחי בלבד

במקום `currentVirtual = virtualPages[currentPage]` שמרנדר רק דף אחד, נרנדר את **כל** ה-`virtualPages` כ-array של sections, פלוס section לדף הסיום (closing) ו-section לדף הסוף/משוב (end).

```text
<main scroll-snap-y mandatory, h-100dvh, overflow-y-scroll>
  <section snap-start h-100dvh> page 0 (cover + עמוד 1) </section>
  <section snap-start h-100dvh> page 1 </section>
  ...
  <section snap-start h-100dvh> closing </section>
  <section snap-start h-100dvh> end/feedback </section>
</main>
```

- כל section מקבל `data-page-index` כדי שנעקוב באיזה דף המשתמש נמצא.
- `IntersectionObserver` (threshold 0.6) יעדכן את `currentPage` לפי ה-section הנראה — זה מזין את:
  - `BookHeader` (כפתורי edit/nikud לדף הנוכחי)
  - מד התקדמות / מספר דף
  - אנליטיקה (`trackPageViewed`)
  - preload של איורים סמוכים (כבר יש לוגיקה — נמשיך להאכיל אותה ב-`currentPage`)

### 2. ביטול fade-out / setIsFlipping

- נסיר את `isFlipping`, `slideDirection`, ה-`setTimeout(300)` וה-`opacity-0` עוטף את הדף.
- `handlePageNav('next'|'prev')` יחליף ל-`scrollToPage(index)` שמשתמש ב-`element.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- כפתורי החצים התחתונים וניווט מקלדת (חיצים ימין/שמאל) ימשיכו לעבוד — רק יקראו ל-`scrollToPage`.

### 3. מניעת ההבזק הלבן

- ה-section פעיל תמיד גם כשגוללים — האיור נטען מראש (יש כבר preload) ולא נמחק מה-DOM.
- ה-background של ה-`<main>` יישאר כהה (`bg-gradient-to-b from-[#1a0a1a]...`) כך שגם בזמן rubber-band או רגע לפני שהאיור הבא נכנס לוויו-פורט אין רקע לבן.
- כל section יקבל `bg-black` כברירת מחדל (לפני שהאיור עולה) במקום הרקע הקרם הבהיר של ה-loader. הספינר עדיין יוצג, אבל מעל רקע כהה — בלי הבזק.
- נסיר את ה-`overflow-hidden` מהעוטף שגרם לקיטוע, ובתוך ה-`MagicalBookFrame` נאפשר scroll.

### 4. snap-scroll חלק

ב-CSS:

```css
.story-scroll-container {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  overscroll-behavior: contain; /* מונע bounce שחושף רקע */
  -webkit-overflow-scrolling: touch;
}
.story-scroll-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;
  height: 100dvh;
}
@media (prefers-reduced-motion: reduce) {
  .story-scroll-container { scroll-behavior: auto; }
}
```

### 5. מצבים מיוחדים שצריך לטפל בהם

- **דף 0 (cover overlay)**: ה-overlay של "הספר נוצר במיוחד עבור..." מוצג רק על ה-section הראשון — זה כבר מותנה ב-`currentPage === 0`, אבל בעולם החדש זה תמיד ה-section עם `index === 0`, ללא תלות במצב.
- **דף הסיום (closing)**: הכפתור "לדף הסיום ✨" יקרא ל-`scrollToPage(endIndex)` במקום `handlePageNav('next')`.
- **עריכה / ניקוד**: פעולות BookHeader תלויות ב-`page` הנוכחי. נחשב את זה לפי ה-`currentPage` שמתעדכן מה-IntersectionObserver.
- **כפתור הקלטה לדף**: כל section מציג את הכפתור שלו עם `pageNumber` משלו — לא משתנה.

### 6. מה נשאר זהה

- מבנה `virtualPages` והלוגיקה שיוצרת אותו (combined / illustration / text)
- preload איורים, signed URLs, שמירת אופליין, PDF, הקלטה, edit/nikud, music, accessibility
- ה-end page (משוב + צביעה)
- ה-header

### 7. סיכון וצמצום

- **ביצועים**: 20–30 sections עם תמונות גדולות. כבר יש `loading="eager"` על הדף הנוכחי בלבד דרך preload — נחליף ל-`loading="lazy"` על תמונות שאינן ה-3 הראשונות, ו-`fetchpriority="high"` על הראשונה. זה ימנע פיצוץ זיכרון.
- **תאימות snap-scroll ב-iOS Safari**: בדוק. אם יש בעיות, נשתמש ב-fallback של גלילה רגילה ללא snap.
- **ניווט קיים שמסתמך על `setCurrentPage**` (אנליטיקה, preload effects): ימשיך לעבוד כי `currentPage` עדיין קיים — רק מקור העדכון משתנה (observer במקום click).

## מה משתנה למשתמש

- אין יותר עיכוב 300ms עם דף לבן בין מעברים.
- גלילה טבעית באצבע / scroll wheel — וגם הכפתורים והחיצים ממשיכים לעבוד וגוללים בצורה חלקה.
- snap מבטיח שאחרי כל גלילה הדף מתיישר במסך מלא, כך שהחוויה עדיין "דף אחרי דף" ולא ערימת תוכן.