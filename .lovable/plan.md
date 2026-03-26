

## Plan: Enhance Story Prompt with NLP, Autism-Friendly, and Warm Language Guidelines

### Problem
The prompt has basic NLP principles but lacks explicit autism-spectrum adaptations, emotional normalization techniques, and a unified "child feels seen and capable" directive.

### Changes

**File: `supabase/functions/generate-story/index.ts`**

**1. Expand the NLP section (lines 103-127)** — Add sub-sections for:
- **Emotional anchoring**: "עגן תחושות חיוביות בגוף — 'הלב מתחמם', 'הבטן נרגעת', 'הכתפיים יורדות'"
- **Normalizing difficult emotions**: "נרמל רגשות קשים — 'זה בסדר להרגיש ככה, כולם מרגישים ככה לפעמים'"
- **Simple emotional metaphors**: "מטפורות רגשיות פשוטות ומוחשיות — 'הכעס כמו בלון שמתנפח', 'השמחה כמו שמש בבטן'" (not abstract ones)
- **Making the child feel seen**: "הסיפור חייב לגרום לילד להרגיש נראה, מובן ומסוגל — השתמש במשפטים כמו 'הוא יודע שזה קשה, וזה בסדר', 'היא מגלה שהיא יכולה'"

**2. Add new section after line 127: "🧩 התאמה לילדים על הרצף האוטיסטי"**
```
## 🧩 התאמה לילדים על הרצף האוטיסטי (Autism-Friendly Writing)
- **משפטים קצרים וברורים** — ללא עמימות, ללא משמעות כפולה.
- **הימנעות ממטפורות מופשטות** — אם משתמשים במטפורה, היא חייבת להיות מוחשית וברורה ('הכעס כמו בלון' ✅, 'הנשמה שלו עפה' ❌).
- **תיאור מפורש של רגשות** — תמיד הסבר למה הדמות מרגישה כך: 'הוא הרגיש עצוב כי החבר לא שיחק איתו' ✅, 'הוא הרגיש עצוב' בלבד ❌.
- **חזרתיות מרגיעה** — חזור על מבנים ומשפטים מרגיעים לאורך הסיפור (למשל: 'והכל בסדר', 'הוא יודע שהוא יכול').
- **סיומת ברורה ונוחה** — הסיפור חייב להסתיים בצורה ברורה, צפויה ומרגיעה. הילד צריך לדעת שהסיפור נגמר וש'הכל בסדר'.
- **ללא הפתעות פתאומיות בעלילה** — אל תכניס תפניות עלילה לא צפויות או אלמנטים מפחידים. כל שינוי בעלילה צריך להיות הדרגתי ומוכן מראש.
- **רצף ברור** — כל עמוד עוקב באופן הגיוני אחרי הקודם. אין קפיצות בזמן או במקום.
```

**3. Update line 329 (טון כללי)** — Remove "פרוזה ספרותית עשירה ומלודית" and replace with:
```
אמפתי, רגוע, תומך ומעצים. שפה חושית וחמה שבונה ביטחון עצמי וחשיבה צמיחתית. הסיפור גורם לילד להרגיש נראה, מובן ומסוגל — בשפה טבעית כמו שהורה מדבר עם ילדו לפני השינה.
```

### What stays the same
- Story structure, page counts, word counts — unchanged
- Grammar rules, gender matching — unchanged
- All other functions, components, edge functions

