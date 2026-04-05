

## Plan: Add Strict Language Separation Rule to Story Prompts

### Problem
The AI sometimes mixes Hebrew and English words in stories. Need explicit instructions in both prompts to never mix languages.

### Changes — single file: `supabase/functions/generate-story/index.ts`

**1. Hebrew system prompt (line 11)** — Add to the META-INSTRUCTION at the top:

Update the first line of `SYSTEM_PROMPT` to add after the existing "OUTPUT MUST BE 100% HEBREW" text:
```
אם שפת הסיפור היא עברית — כל הטקסט חייב להיות בעברית בלבד, ללא אף מילה באנגלית או בשפה אחרת. אין לערבב שפות בשום מקרה.
```

**2. English system prompt (line ~1202)** — Add a new rule to the English rules section:

Add rule after the existing rules:
```
9. ALL text MUST be in English only — no Hebrew words, no words from any other language. Never mix languages under any circumstances.
```

### What stays the same
- All other prompt content, logic, and formatting
- User prompt sections
- All other files

