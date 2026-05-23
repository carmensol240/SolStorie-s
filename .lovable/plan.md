## תיקון 6 ממצאים קריטיים בלבד

### 1. שיתוף וואטסאפ בכרטיסי הספרייה — חסימת דמו
**קובץ:** `src/components/ui/polaroid-card.tsx`, `src/pages/Library.tsx`

- ב-`Library.tsx`: לחשב פעם אחת `hasAnyPurchase` (קיים `purchases` או `subscriptions` או `story_unlocks` למשתמש). אפשר בקריאה אחת קצרה אחרי `fetchStories`.
- להעביר ל-`PolaroidCard` prop חדש `canShare: boolean` ו-`onLockedShare: (storyId) => void` (שמנווט ל-`/upgrade?firstStory={id}&from=library_share`).
- ב-`polaroid-card.tsx`: ב-`handleShareWhatsApp`, אם `!canShare` ⇒ קריאה ל-`onLockedShare(id)` במקום `window.open`.
- אם אין כפתור שיתוף נראה לעין — להוסיף אותו בכרטיס (בהתאם לאיקון `Share2`) רק אם הוקצה `onLockedShare`/`canShare`. (אם כבר קיים — רק לעטוף.)

### 2. PDF / הדפסה — `guardDemo` ב-`handleShare`
**קובץ:** `src/pages/StoryViewer.tsx`

- בשורה ~1510: `onShare={handleShare}` ⇒ `onShare={guardDemo(handleShare)}`.
- `handleShare` עצמו נשאר ללא שינוי.

### 3. הקלטת קול — חסימה מלאה לדמו
**קובץ:** `src/pages/StoryViewer.tsx`

- `onStartRecording` כבר עטוף בכל 3 המקומות, אבל `onSave` ו-`onPlay` לא — דמו שהצליח איכשהו להתחיל הקלטה (race) יכול לשמור.
- לעטוף בכל 3 המופעים (שורות ~1750/1849/1878):
  - `onSave={guardDemo(pageRecording.saveRecording)}`
  - `onPlay={guardDemo(() => pageRecording.playRecording(currentVirtual.dbPage.page_number))}`

### 4. כפתורי צביעה במסך הסיום — `guardDemo`
**קובץ:** `src/pages/StoryViewer.tsx` (שורות ~1614 ו-~1626)

- `onClick={() => preloadStoryCachedColoring('print')}` ⇒ `onClick={guardDemo(() => preloadStoryCachedColoring('print'))}`
- אותו דבר לכפתור `'online'`.

### 5. `useChildAvatar` בספרייה — child_id הנכון
**קובץ:** `src/pages/Library.tsx`

- במקום `useChildAvatar()` (שמחזיר תמיד את הילד הראשון), לקרוא את ה-`selectedChildId` שנשמר מ-`ChildInfoStep` ב-localStorage (`getUserData(user?.id, 'selectedChildId')` או הילד שמשויך לסיפור האחרון שנפתח), למצוא ב-`children` את ה-name של הילד הזה, ולהעביר אותו: `useChildAvatar(selectedChildName)`.
- אם אין selected — להציג את הראשון כברירת מחדל (התנהגות נוכחית).

### 6. רכישת חבילה — חזרה לסיפור אחרי תשלום
**קובץ:** `src/pages/Upgrade.tsx`

- ב-`handlePayPalSuccess` (חבילה), לפני `setShowSuccess(true)`: אם `firstStoryId` קיים — לשמור:
  ```ts
  sessionStorage.setItem('pendingStoryReturn', JSON.stringify({ path: `/story/${firstStoryId}?upgrade=true` }));
  ```
- `PurchaseSuccessModal` כבר משתמש ב-`pendingStoryReturn` ב-`getRedirectPath()` ⇒ יחזיר אוטומטית לסיפור בלחיצה על "סיום".
- אופציה: לעשות אותו דבר ב-`handleTestPurchase` למשתמש בדיקה, ליציבות.

---

### מה לא משתנה
- שום שינוי ב-DB, RLS, edge functions, או לוגיקת רכישה/קרדיטים.
- שום שינוי ב-`ChildInfoStep.tsx` (כבר תוקן בסבב הקודם).
- שום שינוי בכפתורים/תהליכים אחרים מחוץ ל-6 הפריטים האלה.

### סיכון
- נמוך מאוד — כל השינויים הם עטיפת קריאות קיימות ב-`guardDemo`, הוספת prop ל-PolaroidCard, ושינוי שתי שורות ב-Upgrade.
- אין השפעה על סיפורים קיימים או על משתמשים ששילמו.