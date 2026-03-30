

## Plan: Fix Number vs Letter Confusion in Illustration Prompts

### Problem
For `number-2` topics, `hebrewLearningTarget` = `מספר 2`. This Hebrew text in illustration prompts confuses the image model — it sees Hebrew characters and renders the letter ב (2nd Hebrew letter) instead of the digit 2.

### Root Cause
The illustration prompt guidelines (lines 1309-1312) use `hebrewLearningTarget` for both text and illustration instructions. For numbers, the illustration model needs just the Arabic numeral (e.g., `2`), not the Hebrew phrase `מספר 2`.

### Fix — `supabase/functions/generate-story/index.ts`

#### 1. After line 759, add a new variable for illustration-specific targets

```typescript
// For illustration prompts: use just the digit for numbers, Hebrew letter for letters
const illustrationLearningTarget = learningLetter 
  ? (HEBREW_LETTER_MAP[learningLetter] || learningLetter)
  : learningNumber 
    ? learningNumber  // Just the digit: "2", not "מספר 2"
    : learningColor
      ? (COLOR_HEBREW_MAP[learningColor] || learningColor)
      : learningShape
        ? (SHAPE_HEBREW_MAP[learningShape] || learningShape)
        : null;
```

#### 2. Lines 1309-1312 — Use `illustrationLearningTarget` in illustration guidelines

Replace `hebrewLearningTarget` with `illustrationLearningTarget` in the illustration section only:

```
- באיור הראשון: ${illustrationLearningTarget} מופיעה גדולה ובולטת במרכז האיור בצבע זוהר
- בכל איור: ${illustrationLearningTarget} מופיע איפשהו בסצנה — על קיר, על עץ, על חולצה
- האות/מספר בפונט עגול וצבעוני לילדים
- כל טקסט באיור חייב להיות בעברית בלבד — ${illustrationLearningTarget}
```

Also add for numbers specifically: `"Show the Arabic numeral digit ${learningNumber}, NOT a Hebrew letter."`

#### 3. Lines 1794-1796 — Fix last-page illustration override

For numbers, use the digit explicitly in the English illustration prompt:

```typescript
const targetDesc = learningLetter 
  ? `Hebrew letter ${hebrewLearningTarget}` 
  : `the Arabic numeral digit ${learningNumber} (NOT a Hebrew letter)`;
```

### What stays the same
- `hebrewLearningTarget` still used for story text instructions (lines 1228+) — those are correct
- Color/shape illustration logic unchanged
- No other files touched

