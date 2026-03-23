

## Plan: Natural Age Integration in Story Prompt

### What changes

Update the story generation prompt in `supabase/functions/generate-story/index.ts` to instruct Gemini to weave the child's age naturally into the narrative instead of stating it as a dry fact.

### Changes (single file: `supabase/functions/generate-story/index.ts`)

**1. Hebrew prompt (line ~1133)** — Replace `- גיל: ${ageRange}` with `- גיל: ${ageRange}` but add a new instruction block right after the child details section:

```
### 🎂 שילוב גיל באופן טבעי — כלל חובה!
שלב את גיל הילד באופן טבעי ועדין בתוך הסיפור — לא כמשפט תיאורי ישיר אלא דרך התנהגות או יכולות המתאימות לגיל.
- ❌ אסור: "היא בת ארבע" / "הוא בן שש" כמשפט עובדתי יבש
- ✅ נכון: "היא עדיין קטנה, אבל ליבה גדול" / "כמו כל ילדה בגילה, היא אוהבת לחקור"
- אם חייבים לציין גיל — לשלב אותו בצורה חמה ומשפטית, לדוגמה: "${childName} ${childGender === 'female' ? 'בת' : 'בן'} ה${ageWord} ${childGender === 'female' ? 'המתוקה' : 'המתוק'}"
```

Where `ageWord` is derived from `ageRange` (e.g., "2-4" → "ארבע", "5-7" → "שש", etc.).

**2. English prompt (line ~1096)** — Keep `- Age: ${ageRange}` for context, and add a similar instruction:

```
### Age Integration Rule
Weave the child's age naturally into the story through behavior or abilities — never as a dry factual statement like "She is four years old." Instead use warm phrasing like "still little, but with a big heart" or "${childName}, the sweet four-year-old."
```

**3. Add age word helper** — A small mapping from `ageRange` to a Hebrew word for the natural phrasing example in the prompt (e.g., `"0-2"` → `"שנתיים"`, `"2-4"` → `"ארבע"`, `"5-7"` → `"שש"`, `"8-10"` → `"שמונה"`).

### What stays the same
- All other prompt logic, structure, page counts, and generation flow unchanged
- The `ageRange` value is still passed to the prompt for structural decisions (page count, vocabulary level)

