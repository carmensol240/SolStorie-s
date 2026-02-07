
# תוכנית לתיקון בעיית טעינת תמונות מ-Supabase Storage

## סיכום הבדיקה

לאחר בדיקה מקיפה, זיהיתי את שורש הבעיה:

### בעיה 1: נתונים ישנים עם URLs ציבוריים

ה-bucket `story-illustrations` הוא **פרטי** (private), אבל הנתונים במסד הנתונים מכילים **URLs ציבוריים** ישנים:

```
https://qvdwmkxviaqcgmjotsxe.supabase.co/storage/v1/object/public/story-illustrations/uuid/page-1.png
```

URLs אלו מחזירים שגיאת 403 כי ה-bucket פרטי.

### בעיה 2: דרישת אימות ב-Edge Function

ה-Edge Function `get-signed-illustration-url` דורשת אחד מהתנאים:
- משתמש מחובר שהוא הבעלים של הסיפור
- שיתוף ציבורי עם `shareToken`
- ספרון דיגיטלי ציבורי

כשמשתמש לא מחובר מנסה לטעון תמונות מהספרייה - הוא מקבל 401.

### בעיה 3: רכיב RecentStories לא משתמש ב-SignedImage

הרכיב `RecentStories.tsx` מציג תמונות שער באמצעות `<img src={story.cover_url}>` ישירות, בלי לעבור דרך `SignedImage` שמביא signed URLs.

---

## שלבי התיקון

### שלב 1: עדכון RecentStories להשתמש ב-SignedImage
**קובץ:** `src/components/home/RecentStories.tsx`

שינויים:
- להחליף את ה-`<img>` ב-`SignedImage` component
- להעביר את ה-`storyId` לצורך אימות

### שלב 2: הוספת אפשרות גישה לבעלים בלי storyId
**קובץ:** `supabase/functions/get-signed-illustration-url/index.ts`

שינויים:
- כאשר משתמש מחובר, לאפשר לו גישה לתמונות של הסיפורים שלו
- לחלץ את ה-storyId מהנתיב אם לא הועבר במפורש
- לבדוק בעלות על הסיפור לפי ה-path

### שלב 3: עדכון StoryListItem לשימוש ב-SignedImage
**קובץ:** `src/components/ui/story-list-item.tsx`

שינויים:
- להחליף את ה-`<img>` הידני ב-`SignedImage` component
- לנצל את הקוד הקיים שכבר מביא signed URLs

### שלב 4: תיקון fallback במקרה של שגיאה
**קובץ:** `src/components/ui/signed-image.tsx`

שינויים:
- להוסיף placeholder מותאם אם ה-signed URL נכשל
- לוודא שה-UI לא נשבר אם אין תמונה

---

## פירוט טכני

### RecentStories.tsx - לפני ואחרי

**לפני:**
```tsx
{story.cover_url ? (
  <img
    src={story.cover_url}
    alt={`שער הסיפור של ${story.child_name}`}
    className="w-full h-full object-cover"
  />
) : (
  <div className="...">
    <BookOpen />
  </div>
)}
```

**אחרי:**
```tsx
<SignedImage
  src={story.cover_url}
  storyId={story.id}
  alt={`שער הסיפור של ${story.child_name}`}
  className="w-full h-full object-cover"
  fallback={
    <div className="...">
      <BookOpen />
    </div>
  }
/>
```

### get-signed-illustration-url - לוגיקת אימות משופרת

שינוי עיקרי: כאשר משתמש מחובר ולא הועבר `storyId` - לחלץ את ה-storyId מהנתיב ולבדוק בעלות:

```typescript
// If authenticated user but no storyId provided, extract from paths
if (userId && !storyId && paths.length > 0) {
  // Extract storyId from first path (format: uuid/filename.png)
  const firstPathStoryId = paths[0].split("/")[0];
  
  // Check if user owns this story
  const { data: story } = await supabaseAdmin
    .from("stories")
    .select("user_id")
    .eq("id", firstPathStoryId)
    .maybeSingle();
  
  if (story?.user_id === userId) {
    isAuthorized = true;
  }
}
```

---

## קבצים שישתנו

1. **`src/components/home/RecentStories.tsx`**
   - החלפת `<img>` ב-`SignedImage`
   - הוספת import ל-SignedImage

2. **`supabase/functions/get-signed-illustration-url/index.ts`**
   - הוספת לוגיקה לחילוץ storyId מהנתיב
   - שיפור בדיקת בעלות למשתמשים מחוברים

3. **`src/components/ui/story-list-item.tsx`**
   - שימוש ב-SignedImage במקום img ידני
   - הסרת לוגיקת signed URL כפולה

4. **`src/components/ui/signed-image.tsx`**
   - שיפור ה-fallback handling
   - הוספת תמיכה ב-skeleton loading

---

## הערות חשובות

### לגבי ה-Supabase Project
הפרויקט מחובר ל-Lovable Cloud עם Project ID `qvdwmkxviaqcgmjotsxe`. **לא ניתן לשנות** לפרויקט אחר (`xqoxoxxyfimlbekfjxo`). כל ה-environment variables מוגדרים אוטומטית.

### סדר הפעולות
1. תיקון Edge Function לאפשר גישה לבעלים
2. עדכון הרכיבים להשתמש ב-SignedImage
3. בדיקה עם משתמש מחובר
4. וידוא שתמונות נטענות בספרייה ובדף הבית
