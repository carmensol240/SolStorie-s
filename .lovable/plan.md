

## Plan: Enhance Story Generation Prompt -- Depth, Length & Sensory Richness

### Problem

The current prompt focuses on page counts and rhyming rules but lacks explicit word-count minimums and sensory depth instructions. Stories can end up feeling short or rushed, especially for older children.

### Changes

**File: `supabase/functions/generate-story/index.ts`**

#### 1. Add Word Count Minimums to SYSTEM_PROMPT

In the `## 👶 מבנה סיפור לפי גיל` section (around lines 144-161), add explicit minimum word counts:

- Ages 0-2: ~60-100 words (unchanged)
- Ages 3-6: **minimum 300-400 words total**
- Ages 7-8: **minimum 500-600 words with richer vocabulary**

#### 2. Add Sensory & Pacing Instructions to SYSTEM_PROMPT

Add a new section after the NLP principles block (after line ~70), before the language section:

```
## 🌙 עומק סיפורי וקצב - חובה!

### מבנה עלילתי מלא
כל סיפור חייב לכלול את כל ארבעת השלבים:
1. **פתיחה** - הצגת הדמויות, העולם והאווירה
2. **התפתחות** - בניית העלילה, הכרות עם המצב
3. **שיא** - בעיה, אתגר או רגע מכריע
4. **פתרון** - סיום מספק ומעצים

### אל תסיים מהר מדי!
- **אסור לקפוץ ישר לפתרון.** תן לעלילה להתפתח בטבעיות.
- תאר ריחות, צבעים ותחושות כדי להכניס את הילד לתוך החוויה.
- דוגמה: "הָרוּחַ מְלַטֶּפֶת אֶת לְחָיֶיהָ, / וְרֵיחַ הַפְּרָחִים עוֹלֶה מֵהַגִּנָּה"
- השתמש בתיאורים חושיים: מה הדמות רואה, שומעת, מריחה, מרגישה בגוף

### טון שעת שינה
- חם, מחבק ומרגיע
- קצב שיורד בהדרגה לקראת סוף הסיפור
- הסיום תמיד מרגיע ובטוח - מתאים לקריאה לפני השינה
```

#### 3. Update `getAgeLengthInstruction` Function (lines 583-665)

Add word-count minimum instructions to each age bracket:

- **Ages 2-4 (3-6):** Add `- מינימום 300-400 מילים סה"כ לכל הסיפור` and `- אל תסיים מהר! תאר ריחות, צבעים ותחושות גופניות`
- **Ages 5-7:** Add `- מינימום 400-500 מילים סה"כ` and sensory depth instruction
- **Ages 8-10:** Add `- מינימום 500-600 מילים סה"כ עם אוצר מילים עשיר` and sensory depth instruction

#### 4. Add Anti-Template Instruction to User Prompt

In the Hebrew user prompt section (around line 846), add:

```
## דיוק מוחלט לנושא - אפס תבניות!
- אל תשתמש בתבניות מוכנות או סיפורים גנריים.
- אם ההורה בחר נושא ספציפי - כל פרט בסיפור חייב להיות קשור ישירות לנושא הזה.
- למשל: אם הנושא הוא "הפחד של סול מהים" - כל עמוד חייב לעסוק בים, בגלים, ובהתמודדות עם הפחד הזה.
```

### Technical Notes

| Area | Change |
|------|--------|
| `SYSTEM_PROMPT` (line 10) | Add sensory/pacing section, update age-based word counts |
| `getAgeLengthInstruction()` (line 583) | Add word-count minimums per age bracket |
| Hebrew user prompt (line 788) | Add anti-template and topic-accuracy reinforcement |
| Edge function redeployment | `generate-story` will be redeployed automatically |

No database or frontend changes needed -- this is purely a prompt engineering update to the story generation backend function.

