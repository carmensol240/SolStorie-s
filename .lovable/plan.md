

# הוספת תמונה לתיבת ארגז הכלים החינוכי

## סקירה
כרגע הקטגוריה "ארגז כלים חינוכי" בגלריית הנושאים מציגה רקע סגול גרדיאנטי כי אין לה תמונת hero מוגדרת. התמונה שהועלתה תוכנס כתמונת ה-hero של הקטגוריה.

## שינויים

### 1. העתקת התמונה לפרויקט
- העתקה מ-`user-uploads://ארגז_הכלים.jpeg` אל `src/assets/topic-educational-toolbox.jpeg`

### 2. קובץ: `src/components/wizard/TopicStep.tsx`
- ייבוא התמונה החדשה בראש הקובץ: `import topicEducationalToolbox from "@/assets/topic-educational-toolbox.jpeg"`
- הוספת `castImage: topicEducationalToolbox` להגדרת `EDUCATIONAL_TOOLBOX` (שורה 377-381)

## תוצאה
התיבה הסגולה תציג את התמונה של הילדים עם ארגז הכלים במקום הרקע הגרדיאנטי הריק.
