

# תיקון: כפתור מחיקה וכפתור עריכה בגלריית הסיפורים

## בעיות שנמצאו

### 1. כפתור המחיקה לא עובד
ה-`AlertDialog` (חלון אישור המחיקה) מוטמע בתוך `DropdownMenuItem`. כאשר לוחצים על "מחיקת סיפור", ה-Dropdown נסגר ולכן ה-AlertDialog מאבד את ההקשר שלו ולא מופיע -- מה שגורם לכך שהמחיקה לא מתבצעת.

### 2. כפתור עריכה חסר
הפונקציה `handleEditStory` קיימת ב-`Library.tsx` (שורה 160), אבל היא **לא מועברת** כ-prop ל-`StoryListItem`. בנוסף, ל-`StoryListItem` אין כלל prop בשם `onEdit` בממשק שלו.

---

## תיקונים

### קובץ 1: `src/components/ui/story-list-item.tsx`

**שינוי א -- הוספת prop של onEdit:**
- הוספת `onEdit?: (id: string) => void` לממשק `StoryListItemProps`
- הוספת אפשרות עריכה בתפריט הנפתח (אייקון עיפרון + "עריכת סיפור")

**שינוי ב -- תיקון מחיקה:**
- הוצאת ה-`AlertDialog` מתוך ה-`DropdownMenu` החוצה, כדי שלחיצה על "מחיקת סיפור" תפתח את חלון האישור בנפרד, בלי תלות בסטטוס הDropdown
- הDropdownMenuItem רק ישנה state (`showDeleteDialog`) והDialog יהיה ברמה העליונה של הרכיב

### קובץ 2: `src/pages/Library.tsx`

- העברת `onEdit={handleEditStory}` כ-prop ל-`StoryListItem` (שורה 295 בערך)

---

## פירוט טכני

### story-list-item.tsx -- מבנה חדש

```text
StoryListItem
+-- div (clickable card)
|   +-- Image
|   +-- Text (name, topic, date)
|   +-- DropdownMenu
|       +-- "עריכת סיפור" (calls onEdit)
|       +-- "שינוי מגדר" (calls onGenderSwap)
|       +-- "מחיקת סיפור" (sets showDeleteDialog=true)
+-- AlertDialog (at root level, controlled by showDeleteDialog state)
```

### Library.tsx -- שינוי קטן

הוספת שורה אחת בלבד:

```
onEdit={handleEditStory}
```

ב-props של StoryListItem (ליד onDelete ו-onGenderSwap).

