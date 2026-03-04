

## תיקון: שימוש ב-useChildAvatar בעמוד ההקדשה

### הבעיה
בעמוד ההקדשה, האוואטר נשלף לפי `child_id` מהסיפור — אבל `child_id` הוא nullable ולרוב לא מאוכלס. לכן `childAvatarUrl` תמיד null.

בשאר האפליקציה (ספרייה, פרופילים) נעשה שימוש ב-hook `useChildAvatar` שמחפש את האוואטר לפי שם הילד ו-user_id — וזה עובד.

### פתרון — `src/pages/StoryViewer.tsx`

1. **ייבוא `useChildAvatar`** מ-`@/hooks/use-child-avatar`
2. **הפעלת ה-hook** עם `story?.child_name` — ייתן את ה-`avatarUrl` בדיוק כמו בשאר האפליקציה
3. **הסרת ה-state `childAvatarUrl`** וכל הלוגיקה של שליפת avatar לפי `child_id` בתוך `fetchStory`
4. **החלפת `childAvatarUrl`** ב-`avatarUrl` (מה-hook) בכל מקום ב-JSX

### שינוי יחיד
קובץ: `src/pages/StoryViewer.tsx`
- הוספת import ל-`useChildAvatar`
- הוספת `const { avatarUrl } = useChildAvatar(story?.child_name);`
- הסרת `const [childAvatarUrl, setChildAvatarUrl] = useState<string | null>(null);`
- הסרת בלוק ה-fetch של child avatar (שורות ~478-493)
- החלפת `childAvatarUrl` ב-`avatarUrl` ב-JSX של עמוד ההקדשה

