

## Bug: איורים חוזרים על עצמם — שורש הבעיה ותיקון

### שורש הבעיה

ב-`generateIllustrationWithFace` (שורות 154-246), הפרומפט שנשלח ל-Flux Kontext **לא כולל את תיאור הסצנה הייחודי לכל עמוד**. הפרמטר `prompt` (שמכיל את תוצאת ניתוח הסצנה מ-`analyzePageScene`) מתקבל כארגומנט ראשון של הפונקציה אבל **לא מוזרק לתוך `fullPrompt`** שנשלח ל-FAL.

כלומר — כל עמוד מקבל בדיוק אותו פרומפט סטטי (תיאור דמות + סגנון + negative), בלי שום מידע על מה שקורה בסצנה. זו הסיבה שכל האיורים נראים כמעט זהים.

### שינויים

**`supabase/functions/generate-illustrations/index.ts`**:

1. **הזרקת הסצנה לפרומפט Kontext** (שורות 181-189): הוספת `SCENE: ${prompt}` לתוך `fullPrompt` בפונקציית `generateIllustrationWithFace`, בדיוק כמו שקיים ב-`generateIllustration` (שורה 281).

2. **הוספת seed אקראי** (שורות 200-205): הוספת `seed: Math.floor(Math.random() * 2147483647)` לגוף הבקשה ל-Kontext כדי למנוע caching וחזרתיות.

3. **הוספת `guidance_scale`** לבקשת Kontext כדי לתת לפרומפט הטקסטואלי יותר השפעה על התוצאה.

4. **אותו תיקון ב-`retry-illustration/index.ts`**: הזרקת `SCENE:` גם שם + seed אקראי.

### לפני (הבעיה)
```text
fullPrompt = "FACE REFERENCE... style... MAIN CHARACTER... outfit..."
// ← אין SCENE, אין prompt — אותו טקסט לכל עמוד!
```

### אחרי (התיקון)
```text
fullPrompt = "FACE REFERENCE... style... MAIN CHARACTER... outfit...
SCENE: ${prompt}   ← תיאור הסצנה הייחודי לכל עמוד
seed: random       ← מונע caching"
```

