

## שני תיקונים

### 1. הבהוב EmptyState בספרייה — `src/pages/Library.tsx`

**הבעיה:** `authLoading` הופך ל-`false` לפני שה-`useEffect` מספיק לרוץ עם ה-user האמיתי. ברגע ש-`authLoading=false` ו-`isLoading=false` (כי fetchStories רצה עם user=null), ה-EmptyState מוצג לשנייה.

**הפתרון:** בשורה 87 ב-fetchStories, כש-`user` הוא null — לא לשנות את `isLoading` ל-false. ככה הסקלטון ימשיך להיות מוצג עד שה-user נטען ו-fetch אמיתי רץ:

```tsx
const fetchStories = async () => {
  if (!user) { setStories([]); return; } // ← הסרת setIsLoading(false)
  // ...
};
```

### 2. עדכון מספר נושאים — שני קבצים

**About.tsx שורה 132:** שינוי "מ-50" ל-"מ-70"  
**AboutSolStoriesContent.tsx:** אותו שינוי אם קיים שם "50" (שורה ~12 לפי הקוד שראיתי)

