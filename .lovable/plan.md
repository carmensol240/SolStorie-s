
# תיקוני טקסט ועיצוב בתיבת "אודות StoryTime"

## שינויים נדרשים בקובץ `src/components/shared/AboutStoryTimeContent.tsx`

### 1. צבע המילה StoryTime בפסקה השנייה (שורה 8)
כרגע המילה "StoryTime" מופיעה כטקסט רגיל. נוסיף לה את הגרדיאנט המותגי (סגול-ורוד-כתום) בדיוק כמו שמופיע בכפתור "הגדרות נגישות" בדף ההגדרות.

**לפני:** `נולדה StoryTime.`
**אחרי:** `נולדה` + `<span>` עם `bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent font-semibold`

### 2. תיקון טקסט בפסקת "כלים להתמודדות ועיבוד" (שורה 14)
**לפני:** `סיטואציות מאתגרות בבית או בבית הספר`
**אחרי:** `סיטואציות מאתגרות בבית, בגן או בבית הספר`

### 3. תיקון פסקת המחיר (שורה 32)
**לפני:** `והמחיר? שווה לכל כיס.`
**אחרי:** `והמחיר? פחות מ-9.90₪ לסיפור דיגיטלי וקובץ PDF להדפסה.`

---

## פרטים טכניים

קובץ אחד לעדכון: `src/components/shared/AboutStoryTimeContent.tsx`

**שורה 8** - עטיפת "StoryTime" בספאן עם גרדיאנט:
```tsx
נולדה <span className="font-semibold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">StoryTime</span>.
```

**שורה 14** - הוספת "בגן" לטקסט:
```
סיטואציות מאתגרות בבית, בגן או בבית הספר
```

**שורה 32** - החלפת טקסט המחיר:
```tsx
<p className="font-semibold text-foreground">והמחיר? פחות מ-9.90₪ לסיפור דיגיטלי וקובץ PDF להדפסה.</p>
```
