

## Plan: Refine Anti-Template Instruction in Story Generation Prompt

### Problem

The current "דיוק מוחלט לנושא - אפס תבניות!" instruction is too aggressive -- it could be interpreted as "ignore the 34 built-in topics." The user clarifies that the selected topic should be the **anchor**, personal details should be woven in organically, and each generation should produce **fresh, original content** around the same topic.

### Change

**File: `supabase/functions/generate-story/index.ts`** (lines 882-885)

Replace the current anti-template block with a refined version:

**Before:**
```
## דיוק מוחלט לנושא - אפס תבניות!
- אל תשתמש בתבניות מוכנות או סיפורים גנריים.
- אם ההורה בחר נושא ספציפי - כל פרט בסיפור חייב להיות קשור ישירות לנושא הזה.
- למשל: אם הנושא הוא "הפחד של סול מהים" - כל עמוד חייב לעסוק בים, בגלים, ובהתמודדות עם הפחד הזה.
```

**After:**
```
## דיוק לנושא ומקוריות - חובה!
- השתמש בנושא שההורה בחר מתוך הרשימה כ**עוגן המרכזי** של הסיפור.
- שלב את הפרטים האישיים (שם הילד, תכונות, תחביבים, חברים) בתוך הנושא בצורה אורגנית וטבעית.
- צור תוכן מקורי וחדש בכל פעם סביב אותו נושא - הסיפור חייב להרגיש מותאם אישית ולא כמו טקסט קבוע מראש.
- אל תכתוב סיפור שטחי או גנרי. כל סצנה צריכה להיות ספציפית, עשירה ומפתיעה.
- למשל: אם הנושא הוא "הפחד מהחושך" והילד אוהב דינוזאורים - שלב דינוזאור חבר שעוזר להתמודד עם החושך.
```

### Technical Notes

| Area | Detail |
|------|--------|
| File | `supabase/functions/generate-story/index.ts`, lines 882-885 |
| Scope | 4 lines replaced with 5 lines |
| Deployment | `generate-story` edge function will be redeployed automatically |

No other files or database changes needed.
