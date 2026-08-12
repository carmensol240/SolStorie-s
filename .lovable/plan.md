# הוספת טאבים לפי ילד/ה לדפי הצביעה

## מטרה
העמוד "דפי צביעה" בספרייה יקבל סינון זהה לזה של "סיפורים" — טאבים לפי ילד/ה, כדי שמשפחות עם כמה ילדים יוכלו למצוא בקלות את דפי הצביעה של כל ילד/ה.

## מיקום
`src/pages/Library.tsx`

## שינויים מתוכננים

### 1. יצירת טאבי ילדים לדפי צביעה

להוסיף `useMemo` חדש בשם `coloringChildTabs`, מייד אחרי `childTabs` (שורה ~251), בדיוק באותו דפוס:

```text
for each child in children:
  tab.key   = child.id
  tab.label = child.name
  tab.pages = coloringPages.filter(cp => cp.story_child_name === child.name)

if coloringPages exist with story_child_name not matching any child.name:
  add tab { key: "__other", label: "אחר", pages: unmatched pages }

skip entirely if children.length < 2
```

הבדל היחיד מ-`childTabs`: הסינון מתבצע לפי `cp.story_child_name` (טקסט) ולא לפי `child_id`.

### 2. הסבת `renderColoringPages` לקבל רשימה אופציונלית

הפונקציה הקיימת (`renderColoringPages`) תשונה כך:

```text
renderColoringPages(pages?: ColoringPageRecord[]) = renderColoringPages(coloringPages)
```

בתוכן הפונקציה, כל שימוש ב-`coloringPages` יוחלף בפרמטר `pages` עם ברירת מחדל ל-`coloringPages` המלאה.

### 3. עטיפת דפי הצביעה ברכיב `<Tabs>`

בתוך `<TabsContent value="coloring">` (שורה ~898), במקום:

```tsx
{isLoading || authLoading ? <LoadingSkeleton /> : renderColoringPages()}
```

ישמרו הלוגיקות הקיימות (`isLoading || authLoading` ו-`<LoadingSkeleton />`), ואז יוצגו אחד משניים:

- אם אין דפי צביעה — `renderColoringPages()` (המצב הריק).
- אם `children.length < 2` — `renderColoringPages()` (ללא טאבים, כמו היום).
- אחרת — רכיב `<Tabs>` עם:
  - טאב `__all` → כל דפי הצביעה.
  - טאב לכל ילד/ה מהרשימה.
  - טאב `__other` אם יש דפים שלא שויכו.

### 4. סנכרון `selected_child_id` ב-`onValueChange`

הטאבים החדשים ישתמשו באותה לוגיקה של סיפורים:

```tsx
onValueChange={(value) => {
  if (user && value !== '__all' && value !== '__other') {
    setUserData(user.id, 'selected_child_id', value);
  }
}}
```

אין צורך ב-state נוסף לטאבי דפי הצביעה — ניתן להשתמש ב-`activeTabValue` הקיים (שהגדרנו לסיפורים) או ב-state נפרד. כדי למנוע ריבוי מצבים, נבחר state נפרד `coloringActiveTabValue` שמאפשר לשתי הלשוניות לפעול ב independently.

## מה לא נוגעים בו

- `childTabs` וטאבי הסיפורים נשארים ללא שינוי.
- עיצוב כרטיס דף צביעה בודד (תמונה, כפתורים) לא משתנה.
- `useChildAvatar` וסנכרון האווטאר בראש העמוד נשארים כמו שהם.
- קבצים אחרים לא נוגעים בהם.

## אימות

1. הרצת `bunx tsgo --noEmit`.
2. בדיקה בדפדפן: מעבר בין טאבי ילדים בדפי צביעה מסנן את הדפים ומעדכן את `selected_child_id` ב-localStorage (בדיקה דרך DevTools).
3. וידוא שהאווטאר בראש העמוד מתעדכן בהתאם לטאב הנבחר (באותו אופן כמו בסיפורים).
